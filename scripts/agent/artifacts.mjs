import { mkdir, readdir, lstat, copyFile, realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Public portfolio diagnostics only; no environment/configuration dumps.
const parent = path.join(await realpath(os.tmpdir()), `portfolio-harness-${process.getuid()}`);
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Absolute artifact destination required');
await mkdir(destination, { recursive: true });
let total = 0;
async function copy(source, relative) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const full = path.join(source, entry.name), target = path.join(relative, entry.name);
    if (entry.isDirectory()) await copy(full, target);
    else if (entry.isFile() && /\.(?:log|json|html|zip|png|webm)$/.test(entry.name)) {
      const size = (await lstat(full)).size;
      if (size > 10_000_000 || total + size > 30_000_000) continue;
      total += size; await mkdir(path.dirname(path.join(destination, target)), { recursive: true });
      await copyFile(full, path.join(destination, target));
    }
  }
}
try {
  for (const entry of await readdir(parent, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const session = path.join(parent, entry.name);
    for (const file of await readdir(session)) {
      if (file.endsWith('.log') || file === 'receipt.json') await copyFile(path.join(session, file), path.join(destination, `${entry.name}-${file}`));
      if (file.startsWith('verification-')) {
        for (const report of ['playwright-report', 'test-results']) {
          try { await copy(path.join(session, file, report), `${entry.name}/${report}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
      }
    }
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log(`Collected bounded diagnostics (${total} report bytes).`);
