import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkDocs, headingAnchors } from './docs-check.mjs';

async function fixture(t, adjust = () => {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-docs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const documents = ['AGENTS.md', 'CLAUDE.md', 'docs/engineering/index.md'].map((file) => ({
    path: file, owner: 'portfolio-harness', scope: 'repository', status: 'Live', source: 'synthetic fixture',
  }));
  const registry = { version: 1, documents, instructions: [
    { path: 'AGENTS.md', scope: '.', kind: 'canonical', canonical: 'AGENTS.md' },
    { path: 'CLAUDE.md', scope: '.', kind: 'pointer', canonical: 'AGENTS.md' },
  ] };
  const files = {
    'AGENTS.md': '# Canonical\nStatus: Live\n[Engineering](docs/engineering/index.md#supported-checks)\n',
    'CLAUDE.md': '# Pointer\nStatus: Live\nLoad [AGENTS.md](AGENTS.md).\n',
    'docs/engineering/index.md': '# Engineering\nStatus: Live\n## Supported checks\n[Root](../../AGENTS.md)\n',
  };
  adjust({ registry, files });
  for (const [file, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), text);
  }
  await writeFile(path.join(root, 'docs/engineering/maintained-docs.json'), JSON.stringify(registry));
  return root;
}
test('valid authority, metadata and heading links pass', async (t) => {
  assert.deepEqual(await checkDocs(await fixture(t)), { documents: 3, instructionScopes: 2 });
});
test('missing maintained target has file-specific diagnostic', async (t) => {
  const root = await fixture(t, ({ files }) => { files['AGENTS.md'] += '[bad](missing.md)\n'; });
  await assert.rejects(checkDocs(root), /AGENTS\.md:.*ENOENT/);
});
test('missing heading anchor fails even when target exists', async (t) => {
  const root = await fixture(t, ({ files }) => { files['AGENTS.md'] += '[bad](docs/engineering/index.md#unknown)\n'; });
  await assert.rejects(checkDocs(root), /AGENTS\.md: Missing Markdown heading anchor/);
});
test('duplicate registry path and duplicate authority scope fail', async (t) => {
  const root = await fixture(t, ({ registry }) => {
    registry.documents.push({ ...registry.documents[0] }); registry.instructions.push({ ...registry.instructions[0] });
  });
  await assert.rejects(checkDocs(root), (error) => /Duplicate.*document path/.test(error.message) && /duplicate instruction scope/.test(error.message));
});
test('unknown status and visible status disagreement fail', async (t) => {
  const root = await fixture(t, ({ registry }) => { registry.documents[0].status = 'Ready'; });
  await assert.rejects(checkDocs(root), (error) => /unsupported status Ready/.test(error.message) && /visible Status/.test(error.message));
});
test('Proposed is valid and cannot silently become Live', async (t) => {
  const root = await fixture(t, ({ registry, files }) => {
    registry.documents[2].status = 'Proposed'; files['docs/engineering/index.md'] = files['docs/engineering/index.md'].replace('Status: Live', 'Status: Proposed');
  });
  assert.equal((await checkDocs(root)).documents, 3);
  await writeFile(path.join(root, 'docs/engineering/index.md'), '# Engineering\nStatus: Live\n## Supported checks\n');
  await assert.rejects(checkDocs(root), /visible Status must match registry Proposed/);
});
test('Superseded requires a registered Live successor', async (t) => {
  const root = await fixture(t, ({ registry, files }) => {
    registry.documents[2].status = 'Superseded'; registry.documents[2].successor = 'missing.md';
    files['docs/engineering/index.md'] = files['docs/engineering/index.md'].replace('Status: Live', 'Status: Superseded');
  });
  await assert.rejects(checkDocs(root), /unresolved Live successor missing\.md/);
});
test('Frozen evidence remains explicit and Superseded may point to current Live guidance', async (t) => {
  const root = await fixture(t, ({ registry, files }) => {
    registry.documents.push({ path: 'docs/old.md', owner: 'portfolio-harness', scope: 'original plan', status: 'Frozen evidence', source: 'synthetic historical revision' });
    files['docs/old.md'] = '# Original plan\nStatus: **Frozen evidence** — historic only.\n';
    registry.documents[2].status = 'Superseded'; registry.documents[2].successor = 'AGENTS.md';
    files['docs/engineering/index.md'] = files['docs/engineering/index.md'].replace('Status: Live', 'Status: Superseded');
  });
  assert.equal((await checkDocs(root)).documents, 4);
});
test('missing canonical reference fails', async (t) => {
  const root = await fixture(t, ({ registry, files }) => {
    registry.instructions[1].canonical = 'OTHER.md'; files['CLAUDE.md'] = '# Pointer\nStatus: Live\n';
  });
  await assert.rejects(checkDocs(root), (error) => /missing canonical AGENTS\.md reference/.test(error.message) && /missing link to canonical/.test(error.message));
});
test('parent-path and encoded escapes fail', async (t) => {
  const root = await fixture(t, ({ files }) => { files['AGENTS.md'] += '[bad](../secret.md)\n[encoded](%2e%2e/secret.md)\n'; });
  await assert.rejects(checkDocs(root), /Path escapes repository/);
});
test('symlink outside repository fails', async (t) => {
  const root = await fixture(t, ({ files }) => { files['AGENTS.md'] += '[bad](outside.md)\n'; });
  const outside = await fixture(t);
  await symlink(path.join(outside, 'AGENTS.md'), path.join(root, 'outside.md'));
  await assert.rejects(checkDocs(root), /Symlink escapes repository/);
});
test('fenced and inline code links are examples, not maintained link obligations', async (t) => {
  const root = await fixture(t, ({ files }) => {
    files['AGENTS.md'] += '```md\n[example](missing.md)\n```\n~~~md\n[example](missing.md)\n~~~\n`[inline](missing.md)`\n';
  });
  assert.equal((await checkDocs(root)).documents, 3);
});
test('remote links checked syntactically only and executable schemes rejected', async (t) => {
  const root = await fixture(t, ({ files }) => { files['AGENTS.md'] += '[remote](https://example.invalid/unreachable)\n'; });
  assert.equal((await checkDocs(root)).documents, 3);
  await writeFile(path.join(root, 'AGENTS.md'), '# Root\nStatus: Live\n[bad](javascript:alert)\n');
  await assert.rejects(checkDocs(root), /Unsupported or malformed remote link/);
});
test('remote links reject embedded control characters and spaces without URL normalization bypass', async (t) => {
  for (const code of [0, 9, 13, 32, 127]) {
    const root = await fixture(t, ({ files }) => {
      files['AGENTS.md'] += `[malformed](<https://example.invalid/a${String.fromCharCode(code)}b>)\n`;
    });
    await assert.rejects(checkDocs(root), /Unsupported or malformed remote link/);
  }
});
test('metadata owner and source are mandatory', async (t) => {
  const root = await fixture(t, ({ registry }) => { delete registry.documents[0].owner; registry.documents[0].source = ''; });
  await assert.rejects(checkDocs(root), (error) => /missing owner/.test(error.message) && /missing source/.test(error.message));
});
test('heading anchors support punctuation, Unicode, code, and duplicate suffixes', () => {
  assert.deepEqual([...headingAnchors('# Café `check`!\n## Same\n## Same\n```\n# Hidden\n```\n')], ['café-check', 'same', 'same-1']);
});
test('reference-style links resolve and undefined references fail', async (t) => {
  const root = await fixture(t, ({ files }) => { files['AGENTS.md'] += '[index][hub]\n[hub]: docs/engineering/index.md#supported-checks\n'; });
  assert.equal((await checkDocs(root)).documents, 3);
  await writeFile(path.join(root, 'AGENTS.md'), '# Root\nStatus: Live\n[missing][unregistered]\n');
  await assert.rejects(checkDocs(root), /Missing reference-link definition: unregistered/);
});
test('invalid UTF-8 in maintained guidance fails', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'CLAUDE.md'), Buffer.from([0xff]));
  await assert.rejects(checkDocs(root), /CLAUDE\.md: Invalid UTF-8/);
});
test('new scoped instructions cannot silently bypass registry review', async (t) => {
  const root = await fixture(t, ({ files }) => { files['packages/ui/AGENTS.md'] = '# UI\nStatus: Live\nDifferent policy\n'; });
  await assert.rejects(checkDocs(root), /packages\/ui\/AGENTS\.md: unregistered instruction file/);
});
test('malformed registry entries and aliased paths fail', async (t) => {
  const root = await fixture(t, ({ registry }) => {
    registry.documents.push(null, { ...registry.documents[0], path: './AGENTS.md' }); registry.instructions.push(null);
  });
  await assert.rejects(checkDocs(root), (error) => /invalid document entry/.test(error.message) && /invalid instruction entry/.test(error.message) && /invalid document path/.test(error.message));
});
async function scopedFixture(t, instruction) {
  return fixture(t, ({ registry, files }) => {
    registry.documents.push({ path: 'packages/ui/AGENTS.md', owner: 'portfolio-harness', scope: 'UI rules', status: 'Live', source: 'synthetic scoped constraint' });
    registry.instructions.push({ path: 'packages/ui/AGENTS.md', scope: 'packages/ui', kind: 'scoped', canonical: 'AGENTS.md', ...instruction });
    files['packages/ui/AGENTS.md'] = '# UI rules\nStatus: Live\n[Canonical](../../AGENTS.md)\n';
  });
}
test('correctly registered scoped AGENTS instructions pass', async (t) => {
  assert.equal((await checkDocs(await scopedFixture(t))).instructionScopes, 3);
});
test('scoped AGENTS cannot bypass directory identity by registering as a pointer', async (t) => {
  await assert.rejects(checkDocs(await scopedFixture(t, { kind: 'pointer', scope: 'packages/other' })), /pointer must be root CLAUDE\.md with scope/);
});
test('scoped AGENTS rejects a mismatched or aliased directory scope', async (t) => {
  for (const scope of ['packages/other', 'packages/./ui', '.']) {
    await assert.rejects(checkDocs(await scopedFixture(t, { scope })), /scoped AGENTS\.md path must match its normalized directory scope/);
  }
});
test('root Claude pointer must use root scope', async (t) => {
  const root = await fixture(t, ({ registry }) => { registry.instructions[1].scope = 'packages/ui'; });
  await assert.rejects(checkDocs(root), /pointer must be root CLAUDE\.md with scope/);
});
test('nested Claude pointers and arbitrary instruction filenames are unsupported', async (t) => {
  for (const file of ['packages/ui/CLAUDE.md', 'packages/ui/OTHER.md']) {
    const root = await fixture(t, ({ registry, files }) => {
      registry.documents.push({ path: file, owner: 'portfolio-harness', scope: 'UI', status: 'Live', source: 'synthetic fixture' });
      registry.instructions.push({ path: file, scope: 'packages/ui', kind: 'pointer', canonical: 'AGENTS.md' });
      files[file] = '# Pointer\nStatus: Live\n[Canonical](../../AGENTS.md)\n';
    });
    await assert.rejects(checkDocs(root), /pointer must be root CLAUDE\.md with scope/);
  }
});
