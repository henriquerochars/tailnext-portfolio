import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseDoneWhen, validateAcceptance, executeAcceptance } from './ticket-acceptance.mjs';
const commands=JSON.parse(await readFile(new URL('../../config/harness/acceptance-commands.json',import.meta.url)));
const gates=JSON.parse(await readFile(new URL('../../config/harness/ci-gates.json',import.meta.url)));
const body='## Done when\n- [ ] run: yarn test:harness\n- [ ] check: required-summary\n- [x] human: A person must review.\n';
test('typed acceptance resolves exact fixed argv and never accepts human checkbox',()=>{
  const result=validateAcceptance(body,commands,gates);assert.deepEqual(result[0].argv,['node','scripts/agent/test-harness.mjs']);assert.equal(result[2].status,'pending-human');
});
test('issue injection, invented commands/checks, duplicate/malformed sections fail',()=>{
  for(const command of ['yarn test:harness; touch /tmp/unsafe','$(uname)','node -e anything','yarn test:harness && true','yarn test:harness\n- [ ] nonsense']) assert.throws(()=>validateAcceptance(`## Done when\n- [ ] run: ${command}`,commands,gates));
  for(const malformed of ['',body+'\n## Done when\n- [ ] human: duplicate','## Done when\n- [ ] check: invented','## Done when\n- [ ] run: yarn test:harness\n- [ ] run: yarn test:harness']) assert.throws(()=>validateAcceptance(malformed,commands,gates));
  assert.equal(parseDoneWhen(body).length,3);
});
test('stale revision cannot execute acceptance',async()=>{
  await assert.rejects(executeAcceptance({body,root:process.cwd(),revision:'a'.repeat(40),receipt:{status:'passed',source:{head:'b'.repeat(40)}}}),/Current revision/);
});
