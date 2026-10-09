import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyCommand, loadPolicy } from './command-policy.mjs';
import { offlineAdapter } from './adapter.mjs';
const policy=await loadPolicy();
test('only exact read vectors are advisory candidates, never grants',()=>{assert.equal(classifyCommand(['git','status','--short'],policy).decision,'read-only-candidate');for(const argv of [['git','status','--short','--anything'],['vercel','deploy','--prod'],['sh','-c','git status'],['env','git','status'],['node','-e','anything']])assert.equal(classifyCommand(argv,policy).decision,'prompt');});
test('destructive and malformed commands deny',()=>{for(const argv of [[],['git','reset','--hard','HEAD'],['rm','-rf','/'],['node','bad\0arg']])assert.equal(classifyCommand(argv,policy).decision,'deny');});
test('both offline adapters remain uninstalled and have no native authority',()=>{for(const client of ['codex','claude']){const result=offlineAdapter({event:'command',argv:['git','status','--short']},policy,client);assert.equal(result.installed,false);assert.equal(result.nativeEnforcement,'unverified');assert.equal(result.recommendation.authority,'none');}assert.throws(()=>offlineAdapter({event:'unknown'},policy,'codex'));});
