import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkBudget, logicalLines } from './prompt-budget.mjs';

async function fixture(t, contents) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-budget-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'CLAUDE.md'), 'Canonical pointer\n');
  if (contents !== undefined) await writeFile(path.join(root, 'AGENTS.md'), contents);
  return root;
}
test('exactly 120 logical lines and 11000 bytes pass', async (t) => {
  const text = `${'x\n'.repeat(119)}${'x'.repeat(10762)}`;
  const result = await checkBudget(await fixture(t, text));
  assert.equal(result.lines, 120); assert.equal(result.bytes, 11000);
});
test('121 lines fail even below byte limit', async (t) => {
  await assert.rejects(checkBudget(await fixture(t, 'x\n'.repeat(121))), /121\/120 lines.*budget exceeded/);
});
test('11001 bytes fail even below line limit', async (t) => {
  await assert.rejects(checkBudget(await fixture(t, 'x'.repeat(11001))), /11001\/11000 UTF-8 bytes.*budget exceeded/);
});
test('multibyte text counts actual bytes, not characters', async (t) => {
  const text = 'é'.repeat(5500);
  const result = await checkBudget(await fixture(t, text));
  assert.equal(result.bytes, 11000);
  await assert.rejects(checkBudget(await fixture(t, `${text}é`)), /11002\/11000/);
});
test('CRLF and trailing newline semantics preserve actual byte count', async (t) => {
  const result = await checkBudget(await fixture(t, 'a\r\n\r\nb\r\n'));
  assert.equal(result.lines, 3); assert.equal(result.bytes, 8);
  assert.equal(logicalLines(''), 0); assert.equal(logicalLines('\n'), 1);
  assert.equal(logicalLines('a\n\n'), 2); assert.equal(logicalLines('a\nb'), 2);
});
test('missing canonical instructions fail', async (t) => {
  await assert.rejects(checkBudget(await fixture(t)), /ENOENT/);
});
test('malformed UTF-8 fails without replacement-character truncation', async (t) => {
  await assert.rejects(checkBudget(await fixture(t, Buffer.from([0xc3, 0x28]))), /Invalid UTF-8: AGENTS.md/);
});
test('canonical symlink outside checkout is rejected', async (t) => {
  const root = await fixture(t);
  const outside = await fixture(t, 'outside');
  await symlink(path.join(outside, 'AGENTS.md'), path.join(root, 'AGENTS.md'));
  await assert.rejects(checkBudget(root), /Symlink escapes repository/);
});
test('missing Claude pointer fails independently of canonical size', async (t) => {
  const root = await fixture(t, 'canonical');
  await rm(path.join(root, 'CLAUDE.md'));
  await assert.rejects(checkBudget(root), /ENOENT/);
});
