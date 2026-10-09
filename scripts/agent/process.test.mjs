import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, cp, rm, realpath, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runOwned, startOwnedProcess, requireSuccess } from './process.mjs';
import { assertFreePort } from './browser.mjs';

const environment = { PATH: process.env.PATH };
async function freePort() { const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server,'listening'); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
async function eventuallyFree(port) { for (let i = 0; i < 40; i++) { try { await assertFreePort(port); return; } catch { await new Promise(resolve => setTimeout(resolve,50)); } } throw new Error('Owned descendant retained listener'); }
function listener(port) { return `require('node:net').createServer().listen(${port},'127.0.0.1',()=>console.log('listening'));process.on('SIGTERM',()=>{});setInterval(()=>{},1000)`; }
test('owned process reports exact command exit and bounded output', async () => {
  const result = await runOwned([process.execPath, '-e', 'console.log("ok")'], { env: environment, timeoutMs: 3000 });
  assert.equal(requireSuccess(result,'fixture').stdout.trim(),'ok');
  const failure = await runOwned([process.execPath,'-e','process.exit(7)'],{env:environment,timeoutMs:3000});
  assert.throws(() => requireSuccess(failure,'fixture'), /exit=7/);
  const overflow = await runOwned([process.execPath,'-e','process.stdout.write("x".repeat(10000));setInterval(()=>{},1000)'],{env:environment,timeoutMs:3000,maxOutputBytes:1024});
  assert.equal(overflow.overflow,true); assert.ok(overflow.stdout.length<=1024);
});
test('two independent sessions time out and destroy stubborn descendants', async () => {
  const ports = await Promise.all([freePort(),freePort()]);
  const runs = ports.map(port => runOwned([process.execPath,'-e',`require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(listener(port))}],{stdio:'inherit',detached:true});setInterval(()=>{},1000)`],{env:environment,timeoutMs:1500}));
  const results = await Promise.all(runs);
  for (const result of results) { assert.equal(result.timedOut,true); assert.match(result.stdout,/listening/); }
  await Promise.all(ports.map(eventuallyFree));
});
test('cancellation cleans live owned group without a persisted PID grant', async () => {
  const port = await freePort(); let command;
  command = startOwnedProcess([process.execPath,'-e',listener(port)],{env:environment,timeoutMs:5000,onOutput:()=>command.stop()});
  const result = await command.done; assert.equal(result.cancelled,true); await eventuallyFree(port);
});
test('parent disconnection destroys owned descendants', async () => {
  const port = await freePort();
  const processModule = new URL('./process.mjs',import.meta.url).href;
  const parent = spawn(process.execPath,['--input-type=module','-e',`import { startOwnedProcess } from ${JSON.stringify(processModule)};startOwnedProcess([process.execPath,'-e',${JSON.stringify(listener(port))}],{timeoutMs:10000,onOutput:()=>console.log('ready')});`],{env:environment,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject) => { const timer=setTimeout(()=>reject(new Error('Missing descendant readiness')),3000); parent.stdout.once('data',()=>{clearTimeout(timer);resolve();}); });
  parent.kill('SIGKILL'); await once(parent,'exit'); await eventuallyFree(port);
});
test('foreign listener collision fails and leaves it serving', async () => {
  const server = net.createServer(socket=>socket.end('foreign'));
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  try { await assert.rejects(assertFreePort(server.address().port),/foreign listener/); assert.equal(server.listening,true); }
  finally { await new Promise(resolve=>server.close(resolve)); }
});
test('reviewed archive copies can supervise their own nested process group',async t=>{
  const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-guardian-copy-')));t.after(()=>rm(directory,{recursive:true,force:true}));
  for(const file of ['process.mjs','process-child.mjs','process-preload.mjs']) await cp(new URL(file,import.meta.url),path.join(directory,file));
  const moduleUrl=new URL(`file://${directory}/process.mjs`).href;
  const code=`import {runOwned} from ${JSON.stringify(moduleUrl)};const result=await runOwned([process.execPath,'-e','setInterval(()=>{},1000)'],{timeoutMs:300});if(!result.timedOut)process.exit(2);console.log('archive-clean');`;
  const result=await runOwned([process.execPath,'--input-type=module','-e',code],{env:environment,timeoutMs:3000});
  assert.equal(result.timedOut,false);assert.equal(result.code,0);assert.match(result.stdout,/archive-clean/);
});
test('an explicit minimal child environment retains reviewed grandchild supervision',async()=>{
  const port=await freePort();
  const child=`require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(listener(port))}],{detached:true,stdio:'inherit'});setInterval(()=>{},1000);`;
  const parent=`require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(child)}],{env:{PATH:process.env.PATH},stdio:'inherit'});setInterval(()=>{},1000);`;
  const result=await runOwned([process.execPath,'-e',parent],{env:environment,timeoutMs:1500});
  assert.equal(result.timedOut,true);assert.match(result.stdout,/listening/);await eventuallyFree(port);
});
test('preload preserves sync, callback, undefined args and fork option overloads',async t=>{
  const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'portfolio-overloads-')));t.after(()=>rm(directory,{recursive:true,force:true}));
  const forkFile=path.join(directory,'fork.cjs');await writeFile(forkFile,'process.send(process.env.MARKER);process.disconnect();');
  const code=`import assert from 'node:assert/strict';import cp from 'node:child_process';
const env={PATH:process.env.PATH,MARKER:'kept'};
const result=cp.spawnSync(process.execPath,undefined,{input:'process.stdout.write(process.env.MARKER)',encoding:'utf8',env});assert.equal(result.stdout,'kept');
const output=cp.execFileSync(process.execPath,undefined,{input:'process.stdout.write(process.env.MARKER)',encoding:'utf8',env});assert.equal(output,'kept');
await new Promise((resolve,reject)=>cp.execFile(process.execPath,['-e','process.stdout.write(process.env.MARKER)'],{encoding:'utf8',env},(error,stdout)=>{if(error)return reject(error);assert.equal(stdout,'kept');resolve();}));
await new Promise((resolve,reject)=>{const child=cp.fork(${JSON.stringify(forkFile)},undefined,{env,silent:true,execArgv:[]});child.once('message',message=>{assert.equal(message,'kept');resolve();});child.once('error',reject);});
console.log('overloads-kept');`;
  const result=await runOwned([process.execPath,'--input-type=module','-e',code],{env:environment,timeoutMs:5000});
  assert.equal(requireSuccess(result,'overloads').stdout.trim(),'overloads-kept');
});
