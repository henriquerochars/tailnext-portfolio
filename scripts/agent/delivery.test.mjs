import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliveryReadiness } from './deliver-pr.mjs';
import { watchReadiness } from './watch-pr.mjs';
function fixture(){return {head:'a'.repeat(40),base:'b'.repeat(40),integration:'c'.repeat(40),receipt:{status:'passed',source:{head:'a'.repeat(40),base:'b'.repeat(40)},finishedAt:Date.now()},check:{name:'required-summary',conclusion:'success',source:'a'.repeat(40),base:'b'.repeat(40),integration:'c'.repeat(40)},review:{revision:'a'.repeat(40),status:'approved',reviewer:'independent fixture'},protection:'verified-enforced',preview:{state:'READY',revision:'a'.repeat(40),project:'prj_wwKpcXE1x4QY49tFcVJxtgAwhQOv',browser:'passed'}};}
test('delivery is pure dry-run and requires all current evidence',()=>{const result=deliveryReadiness(fixture());assert.equal(result.ready,true);assert.deepEqual(result.actions,[]);assert.equal(result.publication,'dry-run-only');});
test('stale checks/review/head/base, missing protection and wrong Preview remain pending',()=>{
  for(const mutate of [f=>{f.head='f'.repeat(40);},f=>{f.base='f'.repeat(40);},f=>{f.integration='f'.repeat(40);},f=>{f.review.revision='f'.repeat(40);},f=>{f.check.conclusion='cancelled';},f=>{f.protection=null;},f=>{f.preview.revision='f'.repeat(40);},f=>{f.preview.project='foreign';},f=>{f.receipt.finishedAt-=31*60_000;}]){const f=fixture();mutate(f);assert.equal(deliveryReadiness(f).ready,false);}
});
test('watch polling is bounded and cannot turn pending into success',async()=>{let calls=0;const result=await watchReadiness(async()=>{calls++;return {...fixture(),protection:'unknown'};},{attempts:3,intervalMs:0});assert.equal(calls,3);assert.equal(result.ready,false);assert.equal(result.polling,'bounded-pending');});
