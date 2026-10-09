// Reviewed Node entrypoints and their Node descendants retain the live guardian's
// POSIX group, including Playwright browsers normally launched detached. This is
// process hygiene for reviewed code, not a sandbox for hostile native programs.
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const guardian = fileURLToPath(new URL('./process-child.mjs', import.meta.url));
const preload = fileURLToPath(import.meta.url);
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const guardianDigest = digest(guardian), preloadDigest = digest(preload);
function reviewedGuardian(file) {
  try {
    const peer = path.join(path.dirname(file), 'process-preload.mjs');
    return path.isAbsolute(file) && realpathSync(file) === file && statSync(file).isFile()
      && realpathSync(peer) === peer && statSync(peer).isFile()
      && digest(file) === guardianDigest && digest(peer) === preloadDigest;
  } catch { return false; }
}
for (const method of ['spawn', 'spawnSync', 'fork', 'execFile', 'execFileSync', 'exec', 'execSync']) {
  const original = childProcess[method];
  childProcess[method] = function (...args) {
    const optionsIndex = method === 'exec' || method === 'execSync' ? 1
      : Array.isArray(args[1]) || (args[1] == null && args.length >= 3) ? 2 : 1;
    const candidate = args[optionsIndex];
    // Nested harness tests/runners may create a new live guardian. That guardian
    // has the same self-cleaning IPC contract; ordinary commands cannot detach.
    const ownedGuardian = method === 'spawn' && args[0] === process.execPath
      && Array.isArray(args[1]) && args[1].length === 1 && reviewedGuardian(args[1][0])
      && candidate?.detached === true && candidate?.stdio?.[3] === 'ipc';
    if (!ownedGuardian) {
      const options = { ...(candidate && typeof candidate === 'object' ? candidate : {}), detached: false,
        env: { ...(candidate?.env ?? process.env), NODE_OPTIONS: `--import=${JSON.stringify(preload)}` } };
      if (typeof candidate === 'function') args.splice(optionsIndex, 0, options);
      else args[optionsIndex] = options;
    }
    return Reflect.apply(original, this, args);
  };
}
syncBuiltinESMExports();
