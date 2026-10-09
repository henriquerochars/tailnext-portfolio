import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { TextDecoder } from 'node:util';

export async function readContained(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\') || relative.includes('\0')) {
    throw new Error(`Invalid repository-relative path: ${String(relative)}`);
  }
  const rootPath = await realpath(root);
  const target = path.resolve(rootPath, relative);
  const isInside = (value) => value !== rootPath && value.startsWith(`${rootPath}${path.sep}`);
  if (!isInside(target)) throw new Error(`Path escapes repository: ${relative}`);
  const resolved = await realpath(target);
  if (!isInside(resolved)) throw new Error(`Symlink escapes repository: ${relative}`);
  const bytes = await readFile(resolved);
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error(`Invalid UTF-8: ${relative}`); }
  return { bytes, text };
}
