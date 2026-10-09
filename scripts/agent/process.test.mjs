import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
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
