import { realpath, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const NODE = '24.21.0', YARN = '1.22.22';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export async function reviewedTools(launcher = process.env.HARNESS_YARN ?? process.env.npm_execpath) {
  if (process.versions.node !== NODE) throw new Error(`Harness requires Node ${NODE}; got ${process.versions.node}`);
  if (!launcher || !path.isAbsolute(launcher)) throw new Error('HARNESS_YARN must name the installed Yarn Classic bin/yarn.js');
  const yarn = await realpath(launcher), node = await realpath(process.execPath);
  if (path.basename(yarn) !== 'yarn.js' || path.basename(path.dirname(yarn)) !== 'bin') throw new Error('Unsupported Yarn launcher layout');
  const root = path.dirname(path.dirname(yarn));
  const manifest = await readFile(path.join(root, 'package.json'));
  const pkg = JSON.parse(manifest);
  if (pkg.name !== 'yarn' || pkg.version !== YARN) throw new Error(`Requires Yarn ${YARN}`);
  const output = execFileSync(node, [yarn, '--version'], { env: { PATH: path.dirname(node) }, encoding: 'utf8', timeout: 10_000 }).trim();
  if (output !== YARN) throw new Error('Yarn executable version mismatch');
  const cli = await realpath(path.join(root, 'lib/cli.js'));
  if (!cli.startsWith(`${root}${path.sep}`)) throw new Error('Yarn CLI escapes installation');
  return { node, yarn, versions: { node: NODE, yarn: YARN }, hashes: {
    node: digest(await readFile(node)), launcher: digest(await readFile(yarn)), cli: digest(await readFile(cli)), manifest: digest(manifest),
  } };
}
export function commandVector(argv, tools) {
  if (argv[0] === 'node') return [tools.node, ...argv.slice(1)];
  if (argv[0] === 'yarn') return [tools.node, tools.yarn, ...argv.slice(1)];
  throw new Error('Unreviewed executable');
}
