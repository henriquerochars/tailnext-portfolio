import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { startOwnedProcess } from './process.mjs';
import { assertFreePort } from './browser.mjs';

const browserCode = `import { chromium } from '@playwright/test';
const server = await chromium.launchServer({headless:true});
console.log('BROWSER ' + JSON.stringify({pid:server.process().pid,port:Number(new URL(server.wsEndpoint()).port)}));
setInterval(()=>{},1000);`;
async function assertClean(identity) {
  if (!Number.isInteger(identity?.pid) || !Number.isInteger(identity?.port)) throw new Error('Missing real Chromium identity');
  for (let i = 0; i < 50; i++) {
    let live = false;
    try { live = !/^\s*Z/.test(execFileSync('ps', ['-p', String(identity.pid), '-o', 'stat='], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] })); }
    catch { /* no process remains */ }
    try { await assertFreePort(identity.port); if (!live) return; } catch { /* cleanup pending */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Interrupted Chromium retained a live browser or listener');
}
export async function verifyBrowserLifecycle(work = process.cwd(), env = process.env) {
  let identity, output = '', command;
  command = startOwnedProcess([process.execPath, '--input-type=module', '-e', browserCode], {
    cwd: work, env, timeoutMs: 30_000,
    onOutput: (_stream, chunk) => {
      output += chunk;
      const match = /BROWSER (\{[^\n]+\})/.exec(output);
      if (match && !identity) { identity = JSON.parse(match[1]); command.stop(); }
    },
  });
  const result = await command.done;
  if (!result.cancelled || result.timedOut) throw new Error(`Chromium cancellation fixture failed: ${result.stderr}`);
  await assertClean(identity);
  // Kill the actual live parent handle; the orphaned guardian must self-clean on
  // IPC disconnect. No persisted browser or guardian PID is ever terminated.
  const processModule = new URL('./process.mjs', import.meta.url).href;
  const parentCode = `import {startOwnedProcess} from ${JSON.stringify(processModule)};
startOwnedProcess([process.execPath,'--input-type=module','-e',${JSON.stringify(browserCode)}],{timeoutMs:30000,onOutput:(_stream,text)=>process.stdout.write(text)});`;
  const parent = spawn(process.execPath, ['--input-type=module', '-e', parentCode], { cwd: work, env, shell: false, stdio: ['ignore','pipe','pipe'] });
  let errorOutput = '';
  parent.stderr.on('data', chunk => { errorOutput = (errorOutput + chunk).slice(-4096); });
  let disconnected;
  try {
    disconnected = await new Promise((resolve, reject) => {
      let text = '';
      const timer = setTimeout(() => reject(new Error(`Chromium disconnect fixture readiness failed: ${errorOutput}`)), 30_000);
      parent.stdout.on('data', chunk => {
        text += chunk;
        const match = /BROWSER (\{[^\n]+\})/.exec(text);
        if (match) { clearTimeout(timer); resolve(JSON.parse(match[1])); }
      });
      parent.once('exit', () => { clearTimeout(timer); reject(new Error(`Chromium parent exited before readiness: ${errorOutput}`)); });
    });
  } finally {
    if (parent.exitCode === null && parent.signalCode === null) {
      const exited = once(parent, 'exit');
      parent.kill('SIGKILL'); await exited;
    }
  }
  await assertClean(disconnected);
  console.log('Real Chromium cancellation and parent-disconnect cleanup passed.');
  return { cancellation: 'passed', disconnect: 'passed', platform: process.platform };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await verifyBrowserLifecycle(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
