import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readContained } from './files.mjs';

export const LIMITS = Object.freeze({ lines: 120, bytes: 11000 });
export function logicalLines(text) {
  if (text === '') return 0;
  const records = text.replaceAll('\r\n', '\n').split('\n');
  if (records.at(-1) === '') records.pop();
  return records.length;
}
export async function checkBudget(root = process.cwd()) {
  const canonical = await readContained(root, 'AGENTS.md');
  const measured = { lines: logicalLines(canonical.text), bytes: canonical.bytes.length };
  if (measured.lines > LIMITS.lines || measured.bytes > LIMITS.bytes) {
    throw new Error(`AGENTS.md: ${measured.lines}/${LIMITS.lines} lines, ${measured.bytes}/${LIMITS.bytes} UTF-8 bytes; budget exceeded`);
  }
  const pointer = await readContained(root, 'CLAUDE.md');
  return { ...measured, claudeLines: logicalLines(pointer.text), claudeBytes: pointer.bytes.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await checkBudget();
    console.log(`AGENTS.md: ${result.lines}/120 lines, ${result.bytes}/11000 UTF-8 bytes; CLAUDE.md: ${result.claudeLines} lines, ${result.claudeBytes} bytes`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
