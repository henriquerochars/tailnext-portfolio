import { createHash } from 'node:crypto';

const SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-z][a-z0-9-]*$/;
export const DOCS_ONLY_REASON = 'reviewed-docs-only';
const fail = message => { throw new Error(`ci-contract: ${message}`); };
const hasControl = value => [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
const equal = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label} does not match the current plan`);
};
function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(value, key))) {
    fail(`${label} must contain exactly ${keys.join(', ')}`);
  }
}
function nonemptyArray(value, label) {
  if (!Array.isArray(value) || !value.length) fail(`${label} must be a nonempty array`);
}
function normalizedPath(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 4096
    && !hasControl(value) && !value.includes('\\') && !value.startsWith('/')
    && value.split('/').every(part => part && part !== '.' && part !== '..');
}
export function validateRegistry(registry) {
  object(registry, ['version', 'owner', 'summaryCheck', 'runtime', 'jobs', 'gates'], 'registry');
  if (registry.version !== 1 || registry.owner !== 'portfolio-harness' || registry.summaryCheck !== 'required-summary') fail('unsupported registry identity');
  object(registry.runtime, ['node', 'yarn'], 'runtime');
  for (const value of Object.values(registry.runtime)) if (!/^\d+\.\d+\.\d+$/.test(value)) fail('runtime must use exact versions');
  nonemptyArray(registry.jobs, 'jobs'); nonemptyArray(registry.gates, 'gates');
  const jobs = new Map();
  for (const job of registry.jobs) {
    object(job, ['id', 'timeoutMinutes', 'notApplicableReason'], 'job');
    if (typeof job.id !== 'string' || !ID.test(job.id) || jobs.has(job.id) || ['plan', 'required-summary'].includes(job.id)) fail('duplicate or invalid job ID');
    if (!Number.isInteger(job.timeoutMinutes) || job.timeoutMinutes < 1 || job.timeoutMinutes > 30) fail('invalid job timeout');
    if (![null, DOCS_ONLY_REASON].includes(job.notApplicableReason)) fail('unrecognized exemption');
    jobs.set(job.id, job);
  }
  if (jobs.get('structure')?.notApplicableReason !== null) fail('structure must always run');
  const ids = new Set();
  for (const gate of registry.gates) {
    object(gate, ['id', 'job', 'argv', 'timeoutSeconds', 'zeroSkips', 'scope', 'revision', 'notApplicableReasons'], 'gate');
    if (typeof gate.id !== 'string' || !ID.test(gate.id) || ids.has(gate.id) || !jobs.has(gate.job)) fail('duplicate/unknown gate or job ID');
    ids.add(gate.id);
    nonemptyArray(gate.argv, 'argv'); nonemptyArray(gate.scope, 'scope');
    if (!['node', 'yarn'].includes(gate.argv[0]) || gate.argv.some(value => typeof value !== 'string' || !value || value.length > 4096 || hasControl(value))) fail('invalid reviewed command vector');
    if (!Number.isInteger(gate.timeoutSeconds) || gate.timeoutSeconds < 1 || gate.timeoutSeconds > 900 || typeof gate.zeroSkips !== 'boolean') fail('invalid command bounds');
    if (gate.scope.some(scope => typeof scope !== 'string' || !ID.test(scope)) || gate.revision !== 'integration') fail('unsupported gate scope or revision');
    equal(gate.notApplicableReasons, jobs.get(gate.job).notApplicableReason ? [DOCS_ONLY_REASON] : [], 'gate exemptions');
  }
  for (const id of jobs.keys()) if (!registry.gates.some(gate => gate.job === id)) fail(`job ${id} has no gates`);
  return registry;
}
export function registryDigest(registry) {
  validateRegistry(registry);
  return createHash('sha256').update(JSON.stringify(registry)).digest('hex');
}
export function validateContext(context) {
  object(context, ['event', 'sourceSha', 'integrationSha', 'baseSha', 'runId', 'runAttempt'], 'context');
  if (!['pull_request', 'push', 'merge_group'].includes(context.event)) fail('unsupported event; manual runs are not merge evidence');
  for (const key of ['sourceSha', 'integrationSha']) if (typeof context[key] !== 'string' || !SHA.test(context[key])) fail(`invalid ${key}`);
  if (context.baseSha !== null && (typeof context.baseSha !== 'string' || !SHA.test(context.baseSha))) fail('invalid baseSha');
  for (const key of ['runId', 'runAttempt']) if (typeof context[key] !== 'string' || !/^[1-9]\d*$/.test(context[key])) fail(`invalid ${key}`);
  if (context.event !== 'pull_request' && context.sourceSha !== context.integrationSha) fail('push/merge-group source must be its integration revision');
  return context;
}
export function classifyChanges(paths, { baseAvailable = true } = {}) {
  if (!Array.isArray(paths) || paths.length > 5000 || paths.some(value => !normalizedPath(value)) || new Set(paths).size !== paths.length) fail('invalid changed paths');
  const sorted = [...paths].sort();
  const documentationPath = value => ['README.md', 'AGENTS.md', 'CLAUDE.md', 'docs/engineering/maintained-docs.json'].includes(value)
    || /^(?:docs|specs)\/.+\.md$/.test(value);
  const docsOnly = baseAvailable && sorted.length > 0 && sorted.every(documentationPath);
  return { mode: docsOnly ? 'docs-only' : 'full', changedPathCount: sorted.length,
    changedPathDigest: createHash('sha256').update(JSON.stringify(sorted)).digest('hex') };
}
export function createPlan(registry, context, paths) {
  validateRegistry(registry); validateContext(context);
  const classification = classifyChanges(paths, { baseAvailable: context.baseSha !== null });
  return { version: 1, context, registryDigest: registryDigest(registry), ...classification,
    jobs: registry.jobs.map(job => ({ id: job.id, selected: classification.mode !== 'docs-only' || job.notApplicableReason === null,
      reason: classification.mode === 'docs-only' ? job.notApplicableReason : null })) };
}
export function selectGates(registry, paths, options = {}) {
  validateRegistry(registry);
  const { mode } = classifyChanges(paths, options);
  return registry.gates.map(gate => {
    const exempt = mode === 'docs-only' && gate.notApplicableReasons.includes(DOCS_ONLY_REASON);
    return { ...gate, required: !exempt, notApplicableReason: exempt ? DOCS_ONLY_REASON : null };
  });
}
export function assertCurrentPlan(plan, expected) { equal(plan, expected, 'plan'); }
export function createJobRecord(registry, plan, jobId, completedGateIds) {
  const job = plan.jobs.find(entry => entry.id === jobId);
  if (!job?.selected) fail(`unselected or unknown job ${jobId}`);
  const expected = registry.gates.filter(gate => gate.job === jobId).map(gate => gate.id);
  equal(completedGateIds, expected, 'completed gate IDs');
  return { version: 1, jobId, context: plan.context, registryDigest: registryDigest(registry),
    planDigest: createHash('sha256').update(JSON.stringify(plan)).digest('hex'), completedGateIds };
}
export function validateSummary(registry, expectedPlan, needs) {
  validateRegistry(registry);
  const failures = [];
  const rows = [];
  if (!needs || typeof needs !== 'object' || Array.isArray(needs)) fail('needs must be an object');
  const known = ['plan', ...registry.jobs.map(job => job.id)];
  for (const key of Object.keys(needs)) if (!known.includes(key)) failures.push(`unknown job ${key}`);
  try {
    if (needs.plan?.result !== 'success') fail('plan job did not succeed');
    const plan = JSON.parse(needs.plan.outputs?.plan_json ?? 'null');
    assertCurrentPlan(plan, expectedPlan);
  } catch (error) { failures.push(`plan: ${error.message}`); }
  for (const selection of expectedPlan.jobs) {
    const value = needs[selection.id];
    try {
      if (!value) fail('required job is missing');
      if (!selection.selected) {
        if (value.result !== 'skipped' || value.outputs?.record_json) fail('exempt job must be explicitly skipped without success evidence');
        rows.push({ job: selection.id, status: 'not-applicable', reason: selection.reason });
        continue;
      }
      if (value.result !== 'success') fail(`selected job result is ${String(value.result)}`);
      const record = JSON.parse(value.outputs?.record_json ?? 'null');
      const gates = registry.gates.filter(gate => gate.job === selection.id).map(gate => gate.id);
      equal(record, createJobRecord(registry, expectedPlan, selection.id, gates), 'job evidence');
      rows.push({ job: selection.id, status: 'success', reason: null });
    } catch (error) { failures.push(`${selection.id}: ${error.message}`); rows.push({ job: selection.id, status: 'failure', reason: error.message }); }
  }
  return { ready: failures.length === 0, failures, rows };
}
export function assertNoSkippedTests(output) {
  const skipped = [...output.matchAll(/^# skipped (\d+)\s*$/gm)];
  const tests = [...output.matchAll(/^# tests (\d+)\s*$/gm)];
  if (skipped.length !== 1 || tests.length !== 1 || Number(tests[0][1]) < 1 || Number(skipped[0][1]) !== 0) fail('test gate requires one nonempty TAP run with zero skipped tests');
}
