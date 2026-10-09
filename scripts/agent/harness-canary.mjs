import { readContained } from './files.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export function validateCanary(cases) {
  const required = ['stale-receipt','duplicate-ownership','foreign-listener','missing-ci-job','unsupported-native'];
  if (cases?.version !== 1 || cases.telemetry !== 'unknown' || !Array.isArray(cases.cases)) throw new Error('Canary must remain synthetic with unknown telemetry');
  if (JSON.stringify(cases.cases.map(entry => entry.id).sort()) !== JSON.stringify(required.sort())) throw new Error('Missing/duplicate canary case');
  for (const entry of cases.cases) {
    if (entry.source !== 'synthetic' || typeof entry.failure !== 'string' || !entry.failure || typeof entry.fix !== 'string' || !entry.fix
      || /(?:token|password|secret)\s*[:=]\s*\S+/i.test(entry.failure + entry.fix)) throw new Error('Invalid/unredacted canary evidence');
  }
  return { cases: required.length, telemetry: 'unknown', cadence: 'manual' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(validateCanary(JSON.parse((await readContained(process.cwd(), 'tests/fixtures/harness/cases.json')).text))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
