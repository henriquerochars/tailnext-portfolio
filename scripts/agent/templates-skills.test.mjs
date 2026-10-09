import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateTraceability, checkSpecTemplates } from './spec-templates.mjs';
import { validateSkills } from './skills-validate.mjs';
const contract=JSON.parse(await readFile(new URL('../../tests/fixtures/harness/traceability.json',import.meta.url)));
test('maintained templates and five scoped lifecycle routes pass',async()=>{assert.equal((await checkSpecTemplates()).templates,5);assert.equal((await validateSkills()).skills,5);});
test('traceability rejects missing failure proof, duplicate IDs, unknown reference and invented evidence',()=>{
  for(const mutate of [c=>{c.scenarios.pop();},c=>{c.tests[0].id=c.requirements[0].id;},c=>{c.scenarios[0].test='TEST-999';},c=>{c.liveEvidence='fabricated';}]){const c=structuredClone(contract);mutate(c);assert.throws(()=>validateTraceability(c));}
});
test('unknown skill route and board activation fail',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-skills-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const file of ['.agents','docs','scripts']) await cp(file,path.join(root,file),{recursive:true});
  const file=path.join(root,'scripts/agent/context-routing.json');const routing=JSON.parse(await readFile(file));routing.skills.unknown=['AGENTS.md'];await writeFile(file,JSON.stringify(routing));await assert.rejects(validateSkills(root),/routing/);
  delete routing.skills.unknown;routing.boards='enabled';await writeFile(file,JSON.stringify(routing));await assert.rejects(validateSkills(root),/board authority/);
});
