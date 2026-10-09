import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, lstat, realpath, readdir } from 'node:fs/promises';
import path from 'node:path';

export const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 20_000, maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, LANG: 'C', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_OPTIONAL_LOCKS: '0' } });
}
export async function sourceSnapshot(root, revision, base = null) {
  root = await realpath(root);
  if (!/^[a-f0-9]{40}$/.test(revision) || (base !== null && !/^[a-f0-9]{40}$/.test(base))) throw new Error('Full commit SHAs required');
  if (git(root, 'rev-parse', 'HEAD').trim() !== revision) throw new Error('Reviewed revision differs from HEAD');
  const branch = git(root, 'symbolic-ref', '--quiet', '--short', 'HEAD').trim();
  if (!branch) throw new Error('Owned task branch required');
  if (git(root, 'status', '--porcelain=v1', '--untracked-files=all').trim() || git(root, 'diff', '--cached', '--name-only', revision).trim()) throw new Error('Clean reviewed commit required');
  const objectFormat = git(root, 'rev-parse', '--show-object-format').trim();
  const files = [];
  for (const row of git(root, 'ls-files', '--stage', '-z').split('\0').filter(Boolean)) {
    const match = /^(100644|100755) ([a-f0-9]+) 0\t(.+)$/.exec(row);
    if (!match) throw new Error('Unsupported symlink, submodule or conflicted index');
    const [, mode, expected, file] = match;
    const target = path.join(root, file), stat = await lstat(target);
    if (!stat.isFile() || await realpath(target) !== target) throw new Error(`Source path is not an ordinary contained file: ${file}`);
    const bytes = await readFile(target);
    const blob = createHash(objectFormat).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (blob !== expected || ((stat.mode & 0o111) !== 0) !== (mode === '100755')) throw new Error(`Hidden source/index edit: ${file}`);
    files.push([file, mode, hash(bytes)]);
  }
  let mergeBase = null, paths = [], baseAvailable = false;
  if (base) {
    try {
      mergeBase = git(root, 'merge-base', revision, base).trim();
      paths = git(root, 'diff', '--name-only', '-z', mergeBase, revision).split('\0').filter(Boolean);
      baseAvailable = true;
    } catch { /* missing comparison selects full verification */ }
  }
  const index = git(root, 'rev-parse', '--git-path', 'index').trim();
  const common = await realpath(path.resolve(root, git(root, 'rev-parse', '--git-common-dir').trim()));
  return { root, common, branch, head: revision, tree: git(root, 'rev-parse', 'HEAD^{tree}').trim(), base, mergeBase,
    baseAvailable, paths, objectFormat, files: hash(files), index: hash(await readFile(path.resolve(root, index))),
    lock: hash(await readFile(path.join(root, 'yarn.lock'))) };
}
export async function treeManifest(root, { missing = false } = {}) {
  const rows = [];
  async function walk(relative) {
    for (const entry of (await readdir(path.join(root, relative), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(relative, entry.name), full = path.join(root, file);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isSymbolicLink()) {
        const target = await realpath(full);
        if (!target.startsWith(`${await realpath(root)}${path.sep}`)) throw new Error(`Generated/dependency symlink escapes: ${file}`);
        rows.push([file, 'link', path.relative(root, target)]);
      } else if (entry.isFile()) rows.push([file, (await lstat(full)).mode & 0o777, hash(await readFile(full))]);
      else throw new Error(`Unsupported generated file: ${file}`);
    }
  }
  try {
    const stat = await lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(root) !== root) throw new Error('Manifest root must be an ordinary canonical owned directory');
    await walk('');
  } catch (error) { if (!(missing && error.code === 'ENOENT')) throw error; }
  return { count: rows.length, digest: hash(rows) };
}
export async function outputManifest(work) {
  const result = {};
  for (const directory of ['.next', 'test-results', 'playwright-report']) result[directory] = await treeManifest(path.join(work, directory), { missing: true });
  for (const file of ['next-env.d.ts', 'tsconfig.tsbuildinfo']) {
    try {
      const full = path.join(work, file), stat = await lstat(full);
      if (!stat.isFile() || stat.isSymbolicLink() || await realpath(full) !== full) throw new Error('Generated file escapes owned storage');
      result[file] = hash(await readFile(full));
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return result;
}
