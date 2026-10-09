import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPlan, createJobRecord, validateSummary, selectGates, validateRegistry, assertNoSkippedTests } from './ci-contract.mjs';
import { checkWorkflow, renderWorkflow, ACTIONS } from './ci-workflow.mjs';

const registry = JSON.parse(await readFile(new URL('../../config/harness/ci-gates.json', import.meta.url)));
const context = { event: 'pull_request', sourceSha: 'a'.repeat(40), integrationSha: 'b'.repeat(40), baseSha: 'c'.repeat(40), runId: '1', runAttempt: '1' };
function needsFor(plan) {
  return { plan: { result: 'success', outputs: { plan_json: JSON.stringify(plan) } }, ...Object.fromEntries(plan.jobs.map(job => [job.id, job.selected
    ? { result: 'success', outputs: { record_json: JSON.stringify(createJobRecord(registry, plan, job.id, registry.gates.filter(gate => gate.job === job.id).map(gate => gate.id))) } }
    : { result: 'skipped', outputs: {} }])) };
}
test('shared registry and generated workflow agree with exact runtimes', async () => {
  validateRegistry(registry); assert.deepEqual(registry.runtime, { node: '24.21.0', yarn: '1.22.22' });
  assert.deepEqual(await checkWorkflow(), { jobs: 3, gates: registry.gates.length });
  const workflow = renderWorkflow(registry);
  assert.match(workflow, /branches: \[final\]/); assert.match(workflow, /validate:\n/); assert.match(workflow, /macos-15/);
  assert.match(workflow, /always\(\)/); assert.match(workflow, /persist-credentials: false/);
  for (const value of Object.values(ACTIONS)) assert.ok(workflow.includes(value));
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|continue-on-error/);
});
test('unknown/dependency/CI/empty or unavailable comparison selects all gates', () => {
  for (const paths of [['package.json'], ['yarn.lock'], ['.github/workflows/ci.yml'], ['app/page.tsx'], ['other.md'], []]) assert.ok(selectGates(registry, paths).every(gate => gate.required));
  assert.ok(selectGates(registry, ['README.md'], { baseAvailable: false }).every(gate => gate.required));
  assert.throws(() => selectGates(registry, ['../README.md']));
});
test('docs exemption keeps all structural regressions mandatory', () => {
  const plan = createPlan(registry, context, ['docs/engineering/ci.md']);
  assert.equal(plan.mode, 'docs-only');
  assert.deepEqual(plan.jobs.map(job => job.selected), [true, false, false]);
  assert.equal(validateSummary(registry, plan, needsFor(plan)).ready, true);
  for (const mutation of [needs => { delete needs.validate; }, needs => { needs.validate.result = 'success'; }, needs => { needs.structure.result = 'skipped'; }]) {
    const needs = needsFor(plan); mutation(needs); assert.equal(validateSummary(registry, plan, needs).ready, false);
  }
});
test('summary rejects every missing, failed, cancelled and unexpectedly skipped job', () => {
  const plan = createPlan(registry, context, ['package.json']);
  assert.equal(validateSummary(registry, plan, needsFor(plan)).ready, true);
  for (const id of ['plan', ...registry.jobs.map(job => job.id)]) {
    for (const result of ['failure','cancelled','skipped']) {
      const needs = needsFor(plan); needs[id].result = result; assert.equal(validateSummary(registry, plan, needs).ready, false);
    }
    const needs = needsFor(plan); delete needs[id]; assert.equal(validateSummary(registry, plan, needs).ready, false);
  }
});
test('summary rejects stale revision/base/run, duplicate, missing and unordered gates', () => {
  const plan = createPlan(registry, context, ['package.json']);
  for (const mutate of [record => { record.context.sourceSha = 'f'.repeat(40); }, record => { record.context.baseSha = null; }, record => { record.context.runAttempt = '2'; }, record => { record.completedGateIds.pop(); }, record => { record.completedGateIds.push(record.completedGateIds[0]); }, record => { record.completedGateIds.reverse(); }, record => { record.registryDigest = '0'.repeat(64); }]) {
    const needs = needsFor(plan), record = JSON.parse(needs.validate.outputs.record_json); mutate(record); needs.validate.outputs.record_json = JSON.stringify(record);
    assert.equal(validateSummary(registry, plan, needs).ready, false);
  }
});
test('test evidence requires a nonempty aggregate with no skips', () => {
  assertNoSkippedTests('# tests 3\n# skipped 0\n');
  for (const output of ['', '# tests 0\n# skipped 0\n', '# tests 3\n# skipped 1\n', '# tests 3\n# skipped 0\n# skipped 0\n']) assert.throws(() => assertNoSkippedTests(output));
});
