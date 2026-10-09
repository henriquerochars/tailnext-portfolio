// Reviewed Node entrypoints and their Node descendants retain the live guardian's
// POSIX group, including Playwright browsers normally launched detached. This is
// process hygiene for reviewed code, not a sandbox for hostile native programs.
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
const guardian = fileURLToPath(new URL('./process-child.mjs', import.meta.url));
for (const method of ['spawn', 'spawnSync', 'fork', 'execFile', 'execFileSync', 'exec', 'execSync']) {
  const original = childProcess[method];
  childProcess[method] = function (...args) {
    const optionsIndex = method === 'exec' || method === 'execSync' ? 1 : Array.isArray(args[1]) ? 2 : 1;
    const candidate = args[optionsIndex];
    // Nested harness tests/runners may create a new live guardian. That guardian
    // has the same self-cleaning IPC contract; ordinary commands cannot detach.
    const ownedGuardian = method === 'spawn' && args[0] === process.execPath
      && Array.isArray(args[1]) && args[1].length === 1 && args[1][0] === guardian
      && candidate?.detached === true && candidate?.stdio?.[3] === 'ipc';
    if (!ownedGuardian) {
      const options = { ...(candidate && typeof candidate === 'object' ? candidate : {}), detached: false };
      if (typeof candidate === 'function') args.splice(optionsIndex, 0, options);
      else args[optionsIndex] = options;
    }
    return Reflect.apply(original, this, args);
  };
}
syncBuiltinESMExports();
