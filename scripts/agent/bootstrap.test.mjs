import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, symlink, realpath, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs, withLease, atomicJson, childEnvironment, ownedState, setup, executionConfiguration, yarnShim } from './bootstrap.mjs';
import { commandVector, reviewedTools } from './run-yarn.mjs';
import { sourceSnapshot, treeManifest, outputManifest } from './snapshot.mjs';
import { verify } from './check-changed.mjs';

async function fixture(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-snapshot-')); t.after(()=>rm(root,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,HOME:root,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'},stdio:['ignore','pipe','pipe']}).trim();
  git('init','-b','fixture'); git('config','user.email','fixture@example.invalid'); git('config','user.name','Synthetic Fixture');
  await writeFile(path.join(root,'yarn.lock'),'synthetic lock\n'); await writeFile(path.join(root,'source.txt'),'reviewed\n');
  git('add','.');git('commit','-m','fixture'); return {root,git,sha:git('rev-parse','HEAD')};
}
test('full revisions, issue and session required; duplicate/unknown args fail',()=>{
  const argv=['--revision','a'.repeat(40),'--issue','17','--session','one']; assert.equal(parseArgs(argv).session,'one');
  for(const tail of [['--revision','b'.repeat(40)],['--unknown','x'],['--reuse','--reuse'],['--session','../escape']]) assert.throws(()=>parseArgs([...argv,...tail]));
});
test('source snapshot refuses assume-unchanged and skip-worktree hidden edits',async t=>{
  for(const flag of ['--assume-unchanged','--skip-worktree']) {
    const {root,git,sha}=await fixture(t); await sourceSnapshot(root,sha); git('update-index',flag,'source.txt'); await writeFile(path.join(root,'source.txt'),'hidden edit\n');
    await assert.rejects(sourceSnapshot(root,sha),/Hidden source\/index edit/);
  }
});
test('source snapshot binds base/tree/branch and rejects dirty, staged, symlink and wrong head',async t=>{
  const {root,git,sha}=await fixture(t); const snapshot=await sourceSnapshot(root,sha,sha);
  assert.equal(snapshot.base,sha);assert.equal(snapshot.mergeBase,sha);assert.equal(snapshot.branch,'fixture');
  await assert.rejects(sourceSnapshot(root,'f'.repeat(40)),/differs from HEAD/);
  await writeFile(path.join(root,'source.txt'),'staged');git('add','source.txt');await assert.rejects(sourceSnapshot(root,sha),/Clean/);
  git('restore','--staged','source.txt');git('restore','source.txt');await rm(path.join(root,'source.txt'));await symlink('/dev/null',path.join(root,'source.txt'));await assert.rejects(sourceSnapshot(root,sha));
});
test('exclusive lease spans operation and is released only by its live owner',async t=>{
  const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-lease-')));t.after(()=>rm(directory,{recursive:true,force:true}));
  const context={directory,claim:{session:'one'}};
  await withLease(context,async()=>{await assert.rejects(withLease(context,async()=>{}),/lease already exists/);});
  await assert.rejects(readFile(path.join(directory,'active.json')),/ENOENT/);
  await writeFile(path.join(directory,'active.json'),'stale diagnostic');await assert.rejects(withLease(context,async()=>{}),/inspect stale state/);
});
test('private JSON rejects symlink escapes and permissive state',async t=>{
  const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-state-')));t.after(()=>rm(directory,{recursive:true,force:true}));
  await atomicJson(directory,'receipt.json',{status:'incomplete'});assert.equal(JSON.parse(await readFile(path.join(directory,'receipt.json'))).status,'incomplete');
  const linked=directory+'-link';await symlink(directory,linked);t.after(()=>rm(linked));await assert.rejects(atomicJson(linked,'receipt.json',{}),/Unsafe/);
});
test('minimal execution environment excludes ambient tokens and tool options',()=>{
  const env=childEnvironment({node:'/owned/node',yarn:'/owned/yarn/bin/yarn.js'},'/owned/session',45000);
  assert.equal(env.HARNESS_PORT,'45000');assert.equal(env.NODE_OPTIONS,undefined);assert.equal(env.GITHUB_TOKEN,undefined);assert.equal(env.VERCEL_TOKEN,undefined);
});
test('early source preflight failure invalidates a prior passed receipt',async t=>{
  const {root,sha}=await fixture(t),args={revision:sha,issue:'17',session:'preflight-fixture'};
  const state=await ownedState(root,args,{create:true,branch:'fixture'});t.after(()=>rm(state.directory,{recursive:true,force:true}));
  await atomicJson(state.directory,'receipt.json',{version:1,status:'passed'});
  await writeFile(path.join(root,'source.txt'),'dirty');
  await assert.rejects(verify(root,args),/Clean reviewed/);
  assert.equal(JSON.parse(await readFile(path.join(state.directory,'receipt.json'))).status,'failed');
  await atomicJson(state.directory,'receipt.json',{version:1,status:'passed'});
  await assert.rejects(setup(root,args),/Clean reviewed/);
  assert.equal(JSON.parse(await readFile(path.join(state.directory,'receipt.json'))).status,'failed');
});
test('dependency/generated roots and generated files reject external symlinks',async t=>{
  const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-manifest-')));t.after(()=>rm(root,{recursive:true,force:true}));
  const external=path.join(root,'external');await mkdir(external);await writeFile(path.join(external,'package.json'),'synthetic');
  await symlink(external,path.join(root,'node_modules'));await assert.rejects(treeManifest(path.join(root,'node_modules')),/Manifest root/);
  await symlink(external,path.join(root,'.next'));await assert.rejects(outputManifest(root),/Manifest root/);
  await rm(path.join(root,'.next'));await symlink(path.join(external,'package.json'),path.join(root,'next-env.d.ts'));await assert.rejects(outputManifest(root),/Generated file escapes/);
});
test('private execution config rejects changed shell, shim, extras and symlinks',async t=>{
  const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-execution-config-')));t.after(()=>rm(directory,{recursive:true,force:true}));
  await mkdir(path.join(directory,'bin'),{mode:0o700});
  const tools={node:'/owned/node',yarn:'/owned/yarn/bin/yarn.js'},context={directory,tools};
  await writeFile(path.join(directory,'empty.npmrc'),'',{mode:0o600});await writeFile(path.join(directory,'bin/yarn'),yarnShim(tools),{mode:0o700});
  const before=await executionConfiguration(context);assert.equal(before['empty.npmrc'].digest.length,64);
  assert.deepEqual(commandVector(['yarn','build'],tools),['/owned/node','/owned/yarn/bin/yarn.js','--no-default-rc','build']);
  await writeFile(path.join(directory,'empty.npmrc'),'script-shell=/synthetic/changed-shell');await assert.rejects(executionConfiguration(context),/Mutable/);
  await writeFile(path.join(directory,'empty.npmrc'),'');await writeFile(path.join(directory,'bin/yarn'),'changed');await assert.rejects(executionConfiguration(context),/Mutable/);
  await writeFile(path.join(directory,'bin/yarn'),yarnShim(tools));await writeFile(path.join(directory,'bin/node'),'unexpected');await assert.rejects(executionConfiguration(context),/Unexpected private executable/);
  await rm(path.join(directory,'bin/node'));await rm(path.join(directory,'empty.npmrc'));await symlink(path.join(directory,'bin/yarn'),path.join(directory,'empty.npmrc'));await assert.rejects(executionConfiguration(context),/Mutable\/escaped/);
});
test('tool probe isolates rc/cache execution and binds the transitive launcher helper',async t=>{
  const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-tool-probe-')));t.after(()=>rm(root,{recursive:true,force:true}));
  await mkdir(path.join(root,'bin'));await mkdir(path.join(root,'lib'));
  await writeFile(path.join(root,'package.json'),JSON.stringify({name:'yarn',version:'1.22.22'}));
  await writeFile(path.join(root,'lib/cli.js'),'synthetic CLI');
  await writeFile(path.join(root,'lib/v8-compile-cache.js'),'synthetic helper one');
  const launcher=path.join(root,'bin/yarn.js');
  await writeFile(launcher,`if (!process.argv.includes('--no-default-rc') || process.env.DISABLE_V8_COMPILE_CACHE !== '1') process.exit(42); console.log('1.22.22');`);
  const before=await reviewedTools(launcher);
  await writeFile(path.join(root,'lib/v8-compile-cache.js'),'synthetic helper two');
  const after=await reviewedTools(launcher);assert.notEqual(before.hashes.compileCache,after.hashes.compileCache);
  await rm(path.join(root,'lib/v8-compile-cache.js'));await symlink(path.join(root,'..','outside-helper'),path.join(root,'lib/v8-compile-cache.js'));
  await assert.rejects(reviewedTools(launcher));
});
