import { readContained } from './files.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const KINDS = ['spec', 'plan', 'adr', 'acceptance', 'task-links'];
export function validateTraceability(contract) {
  if (contract?.version !== 1 || !/^[1-9]\d*$/.test(String(contract.issue)) || contract.status !== 'Proposed') throw new Error('Invalid synthetic traceability metadata');
  const indexed = new Map();
  for (const [kind, entries] of Object.entries({ requirements: contract.requirements, scenarios: contract.scenarios, tests: contract.tests })) {
    if (!Array.isArray(entries) || !entries.length) throw new Error(`Missing ${kind}`);
    for (const entry of entries) {
      if (!/^[A-Z]+-\d{3}$/.test(entry.id) || indexed.has(entry.id)) throw new Error('Duplicate/invalid trace ID');
      indexed.set(entry.id, { ...entry, kind });
    }
  }
  for (const requirement of contract.requirements) {
    for (const outcome of ['success', 'failure']) {
      if (!contract.scenarios.some(scenario => scenario.requirement === requirement.id && scenario.outcome === outcome
        && indexed.get(scenario.test)?.kind === 'tests')) throw new Error(`Missing ${outcome} proof for ${requirement.id}`);
    }
  }
  for (const scenario of contract.scenarios) if (indexed.get(scenario.requirement)?.kind !== 'requirements' || indexed.get(scenario.test)?.kind !== 'tests' || !['success', 'failure'].includes(scenario.outcome)) throw new Error('Unresolved scenario reference');
  if (contract.terminalArtifact !== 'implementation-pr' || contract.liveEvidence !== null) throw new Error('Synthetic proposal cannot claim live evidence');
  return true;
}
export async function checkSpecTemplates(root = process.cwd()) {
  for (const kind of KINDS) {
    const { text } = await readContained(root, `docs/engineering/templates/${kind}.md`);
    for (const pattern of [/^Status: Proposed$/m, /^Owner: /m, /^Source: /m, /^## /m]) if (!pattern.test(text)) throw new Error(`${kind}: missing template metadata/sections`);
  }
  validateTraceability(JSON.parse((await readContained(root, 'tests/fixtures/harness/traceability.json')).text));
  return { templates: KINDS.length, synthetic: true };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(await checkSpecTemplates()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
