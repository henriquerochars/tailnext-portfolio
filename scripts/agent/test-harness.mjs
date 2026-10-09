import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const files = [];
for (const directory of ['scripts/agent', 'scripts/agent-hooks']) {
  for (const file of await readdir(directory)) if (file.endsWith('.test.mjs')) files.push(`${directory}/${file}`);
}
if (files.length < 8) throw new Error('Incomplete harness regression inventory');
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files.sort()], { stdio: 'inherit', shell: false, timeout: 240_000 });
process.exitCode = result.status ?? 1;
