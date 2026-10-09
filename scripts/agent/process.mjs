import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Only the live guardian owns its POSIX group. No persisted PID authorizes a kill.
export function startOwnedProcess(argv, { cwd, env, timeoutMs = 60_000, maxOutputBytes = 1_048_576, onOutput = () => {} } = {}) {
  if (!['darwin', 'linux'].includes(process.platform)) throw new Error('Unsupported process platform');
  if (!Array.isArray(argv) || !argv.length || argv.some(v => typeof v !== 'string' || !v || v.includes('\0'))
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1_200_000
    || !Number.isInteger(maxOutputBytes) || maxOutputBytes < 1 || maxOutputBytes > 1_048_576) throw new Error('Invalid owned command bounds');
  const guardian = spawn(process.execPath, [fileURLToPath(new URL('./process-child.mjs', import.meta.url))], {
    cwd, env, detached: true, shell: false, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let stdout = '', stderr = '', bytes = 0, result, overflow = false, timedOut = false, cancelled = false;
  let settled = false;
  const stop = (reason = 'cancelled') => {
    if (settled) return;
    cancelled ||= reason === 'cancelled'; timedOut ||= reason === 'timeout'; overflow ||= reason === 'overflow';
    if (guardian.connected) guardian.send({ type: 'stop' }, () => {});
  };
  const capture = (name, chunk) => {
    bytes += chunk.length;
    if (bytes > maxOutputBytes) { stop('overflow'); return; }
    onOutput(name, chunk.toString());
    if (name === 'stdout') stdout += chunk; else stderr += chunk;
  };
  guardian.stdout.on('data', chunk => capture('stdout', chunk));
  guardian.stderr.on('data', chunk => capture('stderr', chunk));
  guardian.on('message', message => { if (message?.type === 'result') result = message; });
  const timer = setTimeout(() => stop('timeout'), timeoutMs);
  const done = new Promise((resolve, reject) => {
    guardian.once('error', error => { settled = true; clearTimeout(timer); reject(error); });
    guardian.once('close', () => {
      settled = true; clearTimeout(timer);
      resolve({ code: result?.code ?? null, signal: result?.signal ?? null, stdout, stderr,
        timedOut: timedOut || result?.timedOut === true, overflow, cancelled, guardian: guardian.pid });
    });
  });
  guardian.send({ type: 'start', argv, timeoutMs }, error => { if (error) stop(); });
  return { done, stop, identity: { guardian: guardian.pid, platform: process.platform } };
}
export async function runOwned(argv, options) {
  const command = startOwnedProcess(argv, options);
  const cancel = () => command.stop();
  process.on('SIGINT', cancel); process.on('SIGTERM', cancel);
  try { return await command.done; }
  finally { process.off('SIGINT', cancel); process.off('SIGTERM', cancel); }
}
export function requireSuccess(result, label) {
  if (result.code !== 0 || result.signal || result.timedOut || result.overflow || result.cancelled) {
    throw new Error(`${label} failed (exit=${result.code}, signal=${result.signal}, timeout=${result.timedOut}, overflow=${result.overflow}, cancelled=${result.cancelled})\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}
