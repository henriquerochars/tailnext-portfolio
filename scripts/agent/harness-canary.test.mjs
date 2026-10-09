import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCanary } from './harness-canary.mjs';
const cases=JSON.parse(await readFile(new URL('../../tests/fixtures/harness/cases.json',import.meta.url)));
test('five synthetic failure/fix cases retain unknown telemetry',()=>assert.equal(validateCanary(cases).cases,5));
test('canary rejects missing case, secret material and fabricated telemetry',()=>{for(const mutate of [c=>{c.cases.pop();},c=>{c.cases[0].failure='token=synthetic-sensitive';},c=>{c.telemetry='all passed';}]){const c=structuredClone(cases);mutate(c);assert.throws(()=>validateCanary(c));}});
