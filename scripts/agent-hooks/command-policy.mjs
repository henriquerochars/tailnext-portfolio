import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function classifyCommand(argv, policy) {
  if (policy?.version !== 1 || policy.mode !== 'advisory-only') throw new Error('Unsupported advisory policy');
  if (!Array.isArray(argv) || !argv.length || argv.length > 128 || argv.some(arg => typeof arg !== 'string' || !arg || arg.length > 4096 || /[\0\n\r]/.test(arg))) return { decision: 'deny', reason: 'malformed-vector', authority: 'none' };
  if (argv[0] === 'git' && argv.includes('reset') && argv.includes('--hard')) return { decision: 'deny', reason: 'destructive-reset', authority: 'none' };
  if (argv[0] === 'rm' && argv.includes('/') && argv.some(arg => /r/.test(arg) && arg.startsWith('-'))) return { decision: 'deny', reason: 'root-deletion', authority: 'none' };
  if (argv.some(arg => /[;&|`<>]|\$\(/.test(arg)) || ['sh','bash','zsh','env','sudo'].includes(path.basename(argv[0]))) return { decision: 'prompt', reason: 'wrapper-or-shell-review', authority: 'none' };
  const read = policy.readOnlyVectors.some(vector => JSON.stringify(vector) === JSON.stringify(argv));
  return { decision: read ? 'read-only-candidate' : 'prompt', reason: read ? 'exact-reviewed-vector' : 'unclassified-action', authority: 'none' };
}
export async function loadPolicy() {
  return JSON.parse(await readFile(fileURLToPath(new URL('./command-policy.v1.json', import.meta.url))));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(classifyCommand(process.argv.slice(2), await loadPolicy()))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
