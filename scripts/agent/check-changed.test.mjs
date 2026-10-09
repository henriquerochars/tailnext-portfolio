import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receiptReusable, MAX_AGE, executeGates } from './check-changed.mjs';
import { hash } from './snapshot.mjs';

const gates=[{id:'one'},{id:'two'}], outputs={'.next':{count:1,digest:'x'}};
const now=Date.now();
function passed(){return {version:1,status:'passed',fingerprint:'exact',startedAt:now-1000,finishedAt:now,gates:gates.map(gate=>({...gate,status:'passed'})),outputs};}
test('complete identical fresh receipt explicitly reuses',()=>assert.equal(receiptReusable(passed(),'exact',gates,outputs,now),true));
test('stale/incomplete/failed/interrupted/future/corrupt receipts never reuse',()=>{
  for(const mutate of [r=>{r.status='incomplete';},r=>{r.status='failed';},r=>{r.finishedAt=now-MAX_AGE-1;},r=>{r.finishedAt=now+1;},r=>{r.finishedAt=null;},r=>{r.startedAt=now+1;},r=>{r.fingerprint='other';},r=>{r.gates.pop();},r=>{r.gates.push(r.gates[0]);},r=>{r.gates.reverse();},r=>{r.gates[0].status='failed';},r=>{r.outputs={};}]) {
    const receipt=passed();mutate(receipt);assert.throws(()=>receiptReusable(receipt,'exact',gates,outputs,now));
  }
  assert.throws(()=>receiptReusable(null,'exact',gates,outputs,now));
});
test('head/base/lock/tool/environment/source/registry/dependency bytes change fingerprint',()=>{
  const input={head:'a',base:'b',lock:'c',tool:'d',environment:'e',source:'f',registry:'g',dependencies:'h'};
  for(const key of Object.keys(input)) assert.notEqual(hash(input),hash({...input,[key]:'changed'}));
});
test('failed gate halts sequence and aggregate deadline fails before execution',async()=>{
  const options={work:process.cwd(),tools:{node:process.execPath},env:{PATH:process.env.PATH},deadline:Date.now()+5000};
  await assert.rejects(executeGates([{id:'fails',argv:['node','-e','process.exit(7)'],timeoutSeconds:2},{id:'must-not-run',argv:['node','-e','throw Error("unsafe")'],timeoutSeconds:2}],options),/fails failed.*exit=7/);
  await assert.rejects(executeGates([{id:'expired',argv:['node','-e','process.exit(0)'],timeoutSeconds:2}],{...options,deadline:0}),/deadline exceeded/);
});
