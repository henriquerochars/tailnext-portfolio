import { readFile, appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPlan, createJobRecord, validateSummary, assertCurrentPlan, validateRegistry } from './ci-contract.mjs';
import { git } from './snapshot.mjs';
import { executeGates, verify, MAX_RUN } from './check-changed.mjs';
import { sessionContext, withLease, prepare, atomicJson } from './bootstrap.mjs';

export function currentPlan(registry, env = process.env, root = process.cwd()) {
  const integrationSha = git(root, 'rev-parse', 'HEAD').trim();
  if (integrationSha !== env.GITHUB_SHA) throw new Error('CI checkout differs from integration SHA');
  let baseSha = /^[a-f0-9]{40}$/.test(env.CI_BASE_SHA ?? '') && !/^0+$/.test(env.CI_BASE_SHA) ? env.CI_BASE_SHA : null;
  let paths = [];
  if (baseSha) {
    try { const merge = git(root, 'merge-base', baseSha, integrationSha).trim(); paths = git(root, 'diff', '--name-only', '-z', merge, integrationSha).split('\0').filter(Boolean); }
    catch { baseSha = null; }
  }
  return createPlan(registry, { event: env.GITHUB_EVENT_NAME, sourceSha: env.CI_SOURCE_SHA, integrationSha,
    baseSha, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT }, paths);
}
async function output(key, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${key}=${text}\n`);
  console.log(`${key}=${text}`);
}
export async function runSelectedJob(registry, plan, jobId, root = process.cwd()) {
  if (!plan.jobs.some(job => job.id === jobId && job.selected)) throw new Error('Unknown or unselected CI job');
  const gates = registry.gates.filter(gate => gate.job === jobId);
  let completed;
  if (jobId === 'structure') {
    completed = await executeGates(gates, { work: root, tools: { node: process.execPath },
      env: { PATH: process.env.PATH, HOME: process.env.RUNNER_TEMP ?? '/tmp', TMPDIR: process.env.RUNNER_TEMP ?? '/tmp', CI: 'true', NEXT_TELEMETRY_DISABLED: '1' }, deadline: Date.now() + MAX_RUN });
  } else {
    const args = { revision: plan.context.integrationSha, base: plan.context.baseSha ?? undefined, issue: '17', session: `ci-${plan.context.runId}-${plan.context.runAttempt}` };
    execFileSync('git', ['switch', '-c', `ci/${jobId}-${args.session}`], { cwd: root, timeout: 10_000 });
    const context = await sessionContext(root, args, { create: true });
    await withLease(context, async () => {
      await atomicJson(context.directory, 'receipt.json', { version: 1, status: 'incomplete', reason: 'ci-setup-started' });
      await prepare(context);
    });
    const receipt = await verify(root, args);
    completed = receipt.gates.filter(gate => gates.some(selected => selected.id === gate.id));
  }
  return createJobRecord(registry, plan, jobId, completed.map(gate => gate.id));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const registry = validateRegistry(JSON.parse(await readFile('config/harness/ci-gates.json')));
    const plan = currentPlan(registry);
    const [command, job] = process.argv.slice(2);
    if (command === 'plan') {
      await output('plan_json', plan);
      for (const selected of plan.jobs) await output(selected.id, String(selected.selected));
    } else if (command === 'run') {
      assertCurrentPlan(JSON.parse(process.env.CI_PLAN ?? 'null'), plan);
      await output('record_json', await runSelectedJob(registry, plan, job));
    } else if (command === 'summary') {
      const result = validateSummary(registry, plan, JSON.parse(process.env.CI_NEEDS ?? 'null'));
      console.log(JSON.stringify({ context: plan.context, ...result }, null, 2));
      if (!result.ready) process.exitCode = 1;
    } else throw new Error('Usage: ci-runner.mjs plan | run JOB | summary');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
