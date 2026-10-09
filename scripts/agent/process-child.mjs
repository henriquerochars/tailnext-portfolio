import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let started = false, finishing = false, deadline;
// The guardian never exits before destroying the group it created. It keeps the
// group ID alive through TERM/KILL, including grandchildren whose parent exited.
function finish(result) {
  if (finishing) return;
  finishing = true; clearTimeout(deadline);
  if (process.connected) process.send({ type: 'result', ...result }, () => {});
  try { process.kill(-process.pid, 'SIGTERM'); } catch { /* group already empty */ }
  setTimeout(() => {
    try { process.kill(-process.pid, 'SIGKILL'); } catch { process.exit(1); }
  }, 200);
}
process.on('SIGTERM', () => { if (!finishing) finish({ code: null, signal: 'SIGTERM' }); });
process.on('SIGINT', () => finish({ code: null, signal: 'SIGINT' }));
process.on('disconnect', () => finish({ code: null, signal: 'disconnect' }));
process.on('message', message => {
  if (message?.type === 'stop') return finish({ code: null, signal: 'cancelled' });
  if (message?.type !== 'start' || started) return finish({ code: null, signal: 'invalid-ipc' });
  started = true;
  clearTimeout(deadline);
  const preload = fileURLToPath(new URL('./process-preload.mjs', import.meta.url));
  const child = spawn(message.argv[0], message.argv.slice(1), {
    shell: false, stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, NODE_OPTIONS: `--import=${JSON.stringify(preload)}` },
  });
  child.once('error', error => { console.error(error.message); finish({ code: 127, signal: null }); });
  child.once('exit', (code, signal) => finish({ code, signal }));
  deadline = setTimeout(() => finish({ code: null, signal: 'deadline', timedOut: true }), message.timeoutMs);
});
deadline = setTimeout(() => finish({ code: null, signal: 'missing-start' }), 5_000);
