import net from 'node:net';
import path from 'node:path';
import { startOwnedProcess, runOwned, requireSuccess } from './process.mjs';

export async function assertFreePort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Explicit unprivileged loopback port required');
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', () => reject(new Error(`Port ${port} occupied; foreign listener left untouched`)));
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise(resolve => server.close(resolve));
}
export async function productionBrowser({ work, tools, env, port, timeoutMs = 180_000 }) {
  const deadline = Date.now() + timeoutMs;
  await assertFreePort(port);
  let ready = false, ended = false, log = '';
  const server = startOwnedProcess([tools.node, path.join(work, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: work, env, timeoutMs,
    onOutput: (_name, chunk) => { log = (log + chunk).slice(-4096); ready ||= /Ready in|Ready on/.test(log); },
  });
  server.done.then(() => { ended = true; });
  const cancel = () => server.stop();
  process.on('SIGINT', cancel); process.on('SIGTERM', cancel);
  try {
    const until = Date.now() + Math.min(timeoutMs, 60_000);
    let healthy = false;
    while (Date.now() < until && !ended) {
      if (ready) {
        try { const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1500) }); healthy = response.ok; } catch { /* startup */ }
        if (healthy) break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready || !healthy || ended) throw new Error(`Owned production server did not become ready: ${log}`);
    if (Date.now() >= deadline) throw new Error('Production browser deadline exceeded');
    const result = requireSuccess(await runOwned([tools.node, tools.yarn, '--no-default-rc', 'test:e2e:ci'], { cwd: work, env, timeoutMs: deadline - Date.now() }), 'Production browser');
    if (ended) throw new Error('Production server exited before browser verification finished');
    return { ...result, server: server.identity, port };
  } finally {
    server.stop(); await server.done;
    process.off('SIGINT', cancel); process.off('SIGTERM', cancel);
  }
}
