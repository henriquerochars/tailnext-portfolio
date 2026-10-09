import { readFile, writeFile, lstat, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, sessionContext, ownedState, withLease, loadSetup, childEnvironment, atomicJson } from './bootstrap.mjs';
import { sourceSnapshot, hash, outputManifest, treeManifest } from './snapshot.mjs';
import { reviewedTools, commandVector } from './run-yarn.mjs';
import { selectGates, assertNoSkippedTests, validateRegistry } from './ci-contract.mjs';
import { runOwned, requireSuccess } from './process.mjs';
import { productionBrowser } from './browser.mjs';

export const MAX_AGE = 30 * 60_000, MAX_RUN = 20 * 60_000;
export function receiptReusable(receipt, fingerprint, gates, outputs, now = Date.now()) {
  if (receipt?.version !== 1 || receipt.status !== 'passed' || receipt.fingerprint !== fingerprint
    || !Number.isFinite(receipt.finishedAt) || now < receipt.finishedAt || now - receipt.finishedAt > MAX_AGE
    || !Number.isFinite(receipt.startedAt) || receipt.finishedAt < receipt.startedAt || receipt.finishedAt - receipt.startedAt > MAX_RUN
    || JSON.stringify(receipt.outputs) !== JSON.stringify(outputs)
    || JSON.stringify(receipt.gates?.map(gate => [gate.id, gate.status])) !== JSON.stringify(gates.map(gate => [gate.id, 'passed']))) throw new Error('Receipt is incomplete, stale, changed or corrupt');
  return true;
}
export async function assertArchiveUnchanged(context, setup) {
  // Generated paths are narrowly enumerated; every reviewed input must retain its bytes/mode.
  const rows = context.snapshot;
  const { git } = await import('./snapshot.mjs');
  const tracked = git(context.root, 'ls-files', '-z').split('\0').filter(Boolean);
  for (const file of tracked) {
    const full = path.join(setup.work, file), stat = await lstat(full);
    if (!stat.isFile() || stat.isSymbolicLink() || await realpath(full) !== full
      || (stat.mode & 0o111) !== ((await lstat(path.join(context.root, file))).mode & 0o111)
      || hash(await readFile(full)) !== hash(await readFile(path.join(context.root, file)))) throw new Error(`Verification changed reviewed input: ${file}`);
  }
  const generated = new Set(['node_modules', '.next', 'next-env.d.ts', 'tsconfig.tsbuildinfo', 'playwright-report', 'test-results']);
  const allowed = new Set(tracked);
  async function scan(relative = '') {
    for (const entry of await readdir(path.join(setup.work, relative), { withFileTypes: true })) {
      const file = path.posix.join(relative, entry.name);
      if (!relative && generated.has(entry.name)) continue;
      if (entry.isDirectory()) await scan(file);
      else if (!allowed.has(file)) throw new Error(`Unexpected verification output: ${file}`);
    }
  }
  await scan();
  return rows.files;
}
export async function executeGates(gates, { work, tools, env, port, deadline, logDirectory }) {
  const completed = [];
  for (const gate of gates) {
    const timeoutMs = Math.min(gate.timeoutSeconds * 1000, deadline - Date.now());
    if (timeoutMs < 1) throw new Error('Aggregate verification deadline exceeded');
    console.log(`Gate ${gate.id}`);
    const result = gate.argv[0] === 'yarn' && gate.argv[1] === 'test:e2e:ci'
      ? await productionBrowser({ work, tools, env, port, timeoutMs })
      : requireSuccess(await runOwned(commandVector(gate.argv, tools), { cwd: work, env, timeoutMs }), gate.id);
    if (gate.zeroSkips) assertNoSkippedTests(result.stdout);
    if (logDirectory) await writeFile(path.join(logDirectory, `${gate.id}.log`), result.stdout + result.stderr, { mode: 0o600 });
    completed.push({ id: gate.id, status: 'passed', command: gate.argv, execution: { guardian: result.guardian, server: result.server ?? null }, outputDigest: hash(result.stdout + result.stderr) });
  }
  return completed;
}
export async function verify(root, args, { consume } = {}) {
  const state = await ownedState(root, args);
  return withLease(state, async () => {
    let previous;
    if (args.reuse) {
      try {
        const file = path.join(state.directory, 'receipt.json'), stat = await lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077)) throw new Error('Unsafe receipt');
        previous = JSON.parse(await readFile(file));
      } catch { /* absence/corruption must invalidate prior success too */ }
    }
    await atomicJson(state.directory, 'receipt.json', { version: 1, status: 'incomplete', reason: 'verification-started' });
    let fingerprint, startedAt = Date.now();
    try {
    const context = await sessionContext(root, args);
    const setup = await loadSetup(context);
    const registry = validateRegistry(JSON.parse(await readFile(path.join(root, 'config/harness/ci-gates.json'))));
    const selectedJob = process.platform === 'darwin' ? 'validate-macos' : 'validate';
    const gates = selectGates(registry, context.snapshot.paths, { baseAvailable: context.snapshot.baseAvailable })
      .filter(gate => gate.required && ['structure', selectedJob].includes(gate.job));
    const port = 40000 + Number.parseInt(hash(context.claim).slice(0, 6), 16) % 20000;
    const env = childEnvironment(context.tools, context.directory, port);
    fingerprint = hash({ snapshot: context.snapshot, claim: context.claim, tools: context.tools, work: setup.work,
      dependencies: setup.dependencies, registry, env, platform: process.platform, arch: process.arch });
    await assertArchiveUnchanged(context, setup);
    if (args.reuse) {
      const outputs = await outputManifest(setup.work);
      receiptReusable(previous, fingerprint, gates, outputs);
      let consumed;
      if (consume) {
        // Acceptance consumes the exact verified installation under this lease.
        consumed = await consume({ context, setup, env });
      }
        if (JSON.stringify(await sourceSnapshot(root, args.revision, args.base ?? null)) !== JSON.stringify(context.snapshot)
          || JSON.stringify(await reviewedTools()) !== JSON.stringify(context.tools)
          || JSON.stringify(await treeManifest(path.join(setup.work, 'node_modules'))) !== JSON.stringify(setup.dependencies)
          || JSON.stringify(await outputManifest(setup.work)) !== JSON.stringify(outputs)) throw new Error('Acceptance inputs/outputs changed during execution');
        await assertArchiveUnchanged(context, setup);
      await atomicJson(context.directory, 'receipt.json', previous);
      console.log('Explicit fresh receipt reuse passed.'); return consume ? consumed : previous;
    }
    startedAt = Date.now() - setup.installDurationMs;
    await atomicJson(context.directory, 'receipt.json', { version: 1, status: 'incomplete', fingerprint, startedAt, gates: [] });
      const completed = await executeGates(gates, { work: setup.work, tools: context.tools, env, port, deadline: startedAt + MAX_RUN, logDirectory: context.directory });
      if (Date.now() - startedAt > MAX_RUN) throw new Error('Aggregate verification deadline exceeded');
      if (JSON.stringify(await sourceSnapshot(root, args.revision, args.base ?? null)) !== JSON.stringify(context.snapshot)
        || JSON.stringify(await reviewedTools()) !== JSON.stringify(context.tools)
        || JSON.stringify(await treeManifest(path.join(setup.work, 'node_modules'))) !== JSON.stringify(setup.dependencies)) throw new Error('Verification inputs changed during execution');
      await assertArchiveUnchanged(context, setup);
      const receipt = { version: 1, status: 'passed', fingerprint, source: context.snapshot, tools: context.tools.versions,
        startedAt, finishedAt: Date.now(), gates: completed, outputs: await outputManifest(setup.work) };
      receiptReusable(receipt, fingerprint, gates, receipt.outputs);
      await atomicJson(context.directory, 'receipt.json', receipt);
      console.log(`All ${gates.length} selected gates passed; receipt bound to ${args.revision}.`);
      return receipt;
    } catch (error) {
      await atomicJson(state.directory, 'receipt.json', { version: 1, status: 'failed', fingerprint, startedAt, finishedAt: Date.now(), error: error.message.slice(0, 8192) });
      throw error;
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await verify(process.cwd(), parseArgs(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
