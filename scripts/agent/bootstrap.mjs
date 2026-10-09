import { mkdir, mkdtemp, realpath, lstat, readFile, writeFile, open, rm, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hash, git, sourceSnapshot, treeManifest } from './snapshot.mjs';
import { reviewedTools, commandVector } from './run-yarn.mjs';
import { runOwned, requireSuccess } from './process.mjs';

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--reuse' && !args.reuse) { args.reuse = true; continue; }
    const key = argv[i]?.replace(/^--/, '');
    if (!['revision', 'base', 'issue', 'session'].includes(key) || Object.hasOwn(args, key) || !argv[i+1] || argv[i+1].startsWith('--')) throw new Error('Invalid/duplicate harness argument');
    args[key] = argv[++i];
  }
  if (!/^[a-f0-9]{40}$/.test(args.revision ?? '') || !/^[1-9]\d*$/.test(args.issue ?? '')
    || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(args.session ?? '') || (args.base && !/^[a-f0-9]{40}$/.test(args.base))) throw new Error('Requires --revision SHA --issue NUMBER --session SLUG [--base SHA] [--reuse]');
  return args;
}
async function privateDirectory(directory) {
  await mkdir(directory, { mode: 0o700, recursive: true });
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid() || (stat.mode & 0o077) || await realpath(directory) !== directory) throw new Error('Unsafe private state directory');
}
export async function atomicJson(directory, name, value) {
  if (!/^[a-z][a-z0-9-]*\.json$/.test(name)) throw new Error('Invalid private record name');
  await privateDirectory(directory);
  const temporary = path.join(directory, `.write-${process.pid}-${Math.random().toString(16).slice(2)}`);
  const handle = await open(temporary, 'wx', 0o600);
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); await handle.sync(); } finally { await handle.close(); }
  const { rename } = await import('node:fs/promises');
  await rename(temporary, path.join(directory, name));
}
export function childEnvironment(tools, directory, port) {
  // No tokens, NODE_OPTIONS, user npm configuration, project .env or ambient CI outputs.
  return { PATH: `${path.dirname(tools.node)}:${path.join(directory, 'bin')}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: path.join(directory, 'home'), TMPDIR: path.join(directory, 'tmp'), LANG: 'en_US.UTF-8', CI: 'true',
    NEXT_TELEMETRY_DISABLED: '1', YARN_CACHE_FOLDER: path.join(directory, 'cache'),
    npm_config_userconfig: path.join(directory, 'empty.npmrc'), npm_config_globalconfig: path.join(directory, 'empty.npmrc'),
    PLAYWRIGHT_BROWSERS_PATH: path.join(directory, 'browsers'), HARNESS_YARN: tools.yarn,
    ...(port ? { HARNESS_PORT: String(port), HARNESS_SERVER_OWNED: '1' } : {}) };
}
export function yarnShim(tools) {
  return `#!/bin/sh\nexec '${tools.node.replaceAll("'", "'\\''")}' '${tools.yarn.replaceAll("'", "'\\''")}' --no-default-rc "$@"\n`;
}
async function writePrivateFile(directory, file, text, mode) {
  const handle = await open(path.join(directory,file), constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, mode);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.uid !== process.getuid() || stat.nlink !== 1 || (stat.mode & 0o777) !== mode) throw new Error('Unsafe private execution file');
    await handle.truncate(0); await handle.writeFile(text);
  } finally { await handle.close(); }
}
export async function executionConfiguration(context) {
  const { directory, tools } = context;
  await privateDirectory(path.join(directory, 'bin'));
  if (JSON.stringify(await readdir(path.join(directory,'bin'))) !== JSON.stringify(['yarn'])) throw new Error('Unexpected private executable');
  const result = {};
  for (const [file, expected, mode] of [['empty.npmrc', '', 0o600], ['bin/yarn', yarnShim(tools), 0o700]]) {
    const full = path.join(directory,file), stat = await lstat(full);
    if (!stat.isFile() || stat.isSymbolicLink() || await realpath(full) !== full || stat.uid !== process.getuid()
      || stat.nlink !== 1 || (stat.mode & 0o777) !== mode) throw new Error(`Mutable/escaped execution configuration: ${file}`);
    const bytes = await readFile(full);
    if (bytes.toString('utf8') !== expected) throw new Error(`Mutable/escaped execution configuration: ${file}`);
    result[file] = { digest: hash(bytes), mode };
  }
  return result;
}
export async function ownedState(root, args, { create = false, branch } = {}) {
  root = await realpath(root);
  const parent = path.join(await realpath(os.tmpdir()), `portfolio-harness-${process.getuid()}`);
  await privateDirectory(parent);
  const directory = path.join(parent, hash(root));
  await privateDirectory(directory);
  const claimPath = path.join(directory, 'claim.json');
  if (create) {
    const claim = { version: 1, root, branch, revision: args.revision, issue: args.issue, session: args.session };
    try {
      const handle = await open(claimPath, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(claim)); } finally { await handle.close(); }
    } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  const stat = await lstat(claimPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.uid !== process.getuid() || (stat.mode & 0o077)) throw new Error('Unsafe claim file');
  const claim = JSON.parse(await readFile(claimPath));
  if (claim.version !== 1 || claim.root !== root || claim.revision !== args.revision || claim.issue !== args.issue || claim.session !== args.session) throw new Error('Duplicate worktree ownership; inspect the prior claim explicitly');
  return { root, args, directory, claim };
}
export async function sessionContext(root, args, { create = false } = {}) {
  root = await realpath(root);
  const snapshot = await sourceSnapshot(root, args.revision, args.base ?? null);
  const tools = await reviewedTools();
  const loaded = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
  if (await realpath(loaded) !== root) throw new Error('Run the reviewed harness from its own worktree');
  if ((await readFile(path.join(root, '.node-version'), 'utf8')).trim() !== tools.versions.node
    || JSON.parse(await readFile(path.join(root, 'package.json'))).packageManager !== `yarn@${tools.versions.yarn}`) throw new Error('Runtime pins differ');
  const state = await ownedState(root, args, { create, branch: snapshot.branch });
  const claim = { version: 1, root, branch: snapshot.branch, revision: args.revision, issue: args.issue, session: args.session };
  if (JSON.stringify(state.claim) !== JSON.stringify(claim)) throw new Error('Changed worktree branch/claim');
  return { ...state, snapshot, tools };
}
export async function withLease(context, operation) {
  await privateDirectory(context.directory);
  const leasePath = path.join(context.directory, 'active.json');
  let handle;
  try { handle = await open(leasePath, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Execution lease already exists; inspect stale state manually; no PID kill is authorized'); throw error; }
  const nonce = randomUUID();
  await handle.writeFile(JSON.stringify({ nonce, pid: process.pid, createdAt: new Date().toISOString(), claim: context.claim }));
  await handle.close();
  try { return await operation(); }
  finally {
    // Only this live invocation may release this lease.
    if (JSON.parse(await readFile(leasePath)).nonce === nonce) await rm(leasePath);
  }
}
export async function prepare(context) {
  const startedAt = Date.now();
  const { directory, root, tools, args } = context;
  const work = await mkdtemp(path.join(directory, 'verification-'));
  // Reviewed archive, never hardlinks to mutable source or dependencies.
  const archive = path.join(work, 'source.tar');
  execFileSync('git', ['-C', root, 'archive', '--format=tar', `--output=${archive}`, args.revision], { timeout: 20_000 });
  execFileSync('tar', ['-xf', archive, '-C', work], { timeout: 20_000 });
  await rm(archive);
  for (const name of ['home', 'tmp', 'cache', 'bin', 'browsers']) await privateDirectory(path.join(directory, name));
  await writePrivateFile(directory, 'empty.npmrc', '', 0o600);
  // Yarn scripts resolve the reviewed launcher through this private shim.
  await writePrivateFile(directory, 'bin/yarn', yarnShim(tools), 0o700);
  const configuration = await executionConfiguration(context);
  const env = childEnvironment(tools, directory);
  const install = requireSuccess(await runOwned(commandVector(['yarn', 'install', '--frozen-lockfile', '--ignore-scripts', '--non-interactive', '--production=false'], tools), {
    cwd: work, env, timeoutMs: 480_000,
  }), 'Frozen reviewed install');
  await writeFile(path.join(directory, 'install.log'), `${install.stdout}\n${install.stderr}`, { mode: 0o600 });
  if (hash(await readFile(path.join(work, 'yarn.lock'))) !== context.snapshot.lock) throw new Error('Frozen installation changed lockfile');
  const dependencies = await treeManifest(path.join(work, 'node_modules'));
  if (JSON.stringify(await executionConfiguration(context)) !== JSON.stringify(configuration)) throw new Error('Execution configuration changed during install');
  const setup = { version: 1, claim: context.claim, tools, work, dependencies, configuration, source: context.snapshot.files, lock: context.snapshot.lock, installDurationMs: Date.now() - startedAt };
  await atomicJson(directory, 'setup.json', setup);
  return setup;
}
export async function loadSetup(context) {
  const file = path.join(context.directory, 'setup.json');
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.uid !== process.getuid() || (stat.mode & 0o077)) throw new Error('Unsafe setup record');
  const setup = JSON.parse(await readFile(file));
  if (JSON.stringify(setup.claim) !== JSON.stringify(context.claim) || JSON.stringify(setup.tools) !== JSON.stringify(context.tools)
    || setup.source !== context.snapshot.files || setup.lock !== context.snapshot.lock
    || !Number.isInteger(setup.installDurationMs) || setup.installDurationMs < 0 || setup.installDurationMs > 1_200_000
    || await realpath(setup.work) !== setup.work || !(await realpath(setup.work)).startsWith(`${context.directory}${path.sep}`)) throw new Error('Stale/escaped setup; run setup again');
  if (JSON.stringify(await treeManifest(path.join(setup.work, 'node_modules'))) !== JSON.stringify(setup.dependencies)) throw new Error('Installed dependency bytes changed');
  if (JSON.stringify(await executionConfiguration(context)) !== JSON.stringify(setup.configuration)) throw new Error('Execution configuration changed');
  return setup;
}
export async function setup(root, args) {
    const state = await ownedState(root, args, { create: true, branch: git(root, 'symbolic-ref', '--quiet', '--short', 'HEAD').trim() });
    await withLease(state, async () => {
      await atomicJson(state.directory, 'receipt.json', { version: 1, status: 'incomplete', reason: 'setup-started' });
      try {
      const context = await sessionContext(root, args);
      await prepare(context);
      if (JSON.stringify(await sourceSnapshot(context.root, args.revision, args.base ?? null)) !== JSON.stringify(context.snapshot)) throw new Error('Source changed during setup');
      if (JSON.stringify(await reviewedTools()) !== JSON.stringify(context.tools)) throw new Error('Tools changed during setup');
      } catch (error) {
        await atomicJson(state.directory, 'receipt.json', { version: 1, status: 'failed', reason: 'setup-failed', error: error.message.slice(0,8192) });
        throw error;
      }
    });
    console.log(`Reviewed setup ready in private storage (${args.session}); verification remains pending.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    await setup(process.cwd(), parseArgs(process.argv.slice(2)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
