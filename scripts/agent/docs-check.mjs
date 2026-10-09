import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readdir } from 'node:fs/promises';
import { readContained } from './files.mjs';

const STATUSES = new Set(['Live', 'Proposed', 'Frozen evidence', 'Superseded']);
async function discoverInstructions(root, relative = '') {
  const skipped = new Set(['.git', 'node_modules', '.next', '.turbo', '.cache']);
  const found = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const file = path.posix.join(relative, entry.name);
    if (entry.isDirectory() && !skipped.has(entry.name)) found.push(...await discoverInstructions(root, file));
    else if (['AGENTS.md', 'CLAUDE.md'].includes(entry.name)) found.push(file);
  }
  return found;
}
export function withoutCode(text) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  let fence;
  return lines.map((line) => {
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (!fence && open) { fence = { char: open[1][0], length: open[1].length }; return ''; }
    if (fence) {
      const close = new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`);
      if (close.test(line)) fence = undefined;
      return '';
    }
    return line.replace(/(`+)[\s\S]*?\1/g, '');
  }).join('\n');
}
export function headingAnchors(text) {
  const counts = new Map();
  const anchors = new Set();
  // Heading text retains inline code; fenced examples never introduce headings.
  let fence;
  for (const line of text.replaceAll('\r\n', '\n').split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (!fence && marker) { fence = marker[1]; continue; }
    if (fence) {
      if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(line)) fence = undefined;
      continue;
    }
    const heading = /^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    if (!heading) continue;
    const slug = heading[1].toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    anchors.add(`${slug}${count ? `-${count}` : ''}`);
  }
  return anchors;
}
function linkTargets(text) {
  const source = withoutCode(text);
  const targets = [...source.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g)]
    .map((match) => match[1].replace(/^<|>$/g, ''));
  const definitions = new Map([...source.matchAll(/^ {0,3}\[([^\]\n]+)\]:\s*(<[^>\n]+>|\S+)/gm)]
    .map((match) => [match[1].toLowerCase(), match[2].replace(/^<|>$/g, '')]));
  for (const match of source.matchAll(/!?\[([^\]\n]+)\]\[([^\]\n]*)\]/g)) {
    const key = (match[2] || match[1]).toLowerCase();
    if (!definitions.has(key)) throw new Error(`Missing reference-link definition: ${key}`);
    targets.push(definitions.get(key));
  }
  return targets;
}
async function checkLink(root, file, target) {
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(target)) {
    const url = new URL(target);
    const hasForbiddenCharacter = [...target].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 32 || code === 127;
    });
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol) || hasForbiddenCharacter) {
      throw new Error(`Unsupported or malformed remote link: ${target}`);
    }
    if (url.protocol === 'mailto:' ? !url.pathname : !url.hostname) throw new Error(`Malformed remote link: ${target}`);
    return; // Syntax only. No fetch, execution, or remote verification.
  }
  const hash = target.indexOf('#');
  const local = hash < 0 ? target : target.slice(0, hash);
  const anchor = hash < 0 ? '' : decodeURIComponent(target.slice(hash + 1));
  const decoded = decodeURIComponent(local);
  if (decoded.startsWith('/') || decoded.includes('\\') || decoded.includes('?')) throw new Error(`Invalid local link: ${target}`);
  const relative = local ? path.posix.join(path.posix.dirname(file), decoded) : file;
  const content = await readContained(root, relative);
  if (anchor && (!/\.md$/i.test(relative) || !headingAnchors(content.text).has(anchor))) {
    throw new Error(`Missing Markdown heading anchor: ${target}`);
  }
}
export async function checkDocs(root = process.cwd()) {
  const registryFile = 'docs/engineering/maintained-docs.json';
  const registry = JSON.parse((await readContained(root, registryFile)).text);
  if (registry.version !== 1 || !Array.isArray(registry.documents) || !Array.isArray(registry.instructions)) {
    throw new Error(`${registryFile}: expected version 1, documents and instructions arrays`);
  }
  const errors = [], entries = new Map();
  for (const entry of registry.documents) {
    if (!entry || typeof entry !== 'object') { errors.push(`${registryFile}: invalid document entry`); continue; }
    if (typeof entry.path !== 'string' || !entry.path || path.posix.normalize(entry.path) !== entry.path || entries.has(entry.path)) errors.push(`Duplicate or invalid document path: ${String(entry.path)}`);
    else entries.set(entry.path, entry);
    if (!STATUSES.has(entry.status)) errors.push(`${entry.path}: unsupported status ${String(entry.status)}`);
    for (const key of ['owner', 'scope', 'source']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) errors.push(`${entry.path}: missing ${key}`);
    }
  }
  const scopes = new Set();
  for (const instruction of registry.instructions) {
    if (!instruction || typeof instruction !== 'object') { errors.push(`${registryFile}: invalid instruction entry`); continue; }
    const { path: file, scope, kind, canonical } = instruction;
    if (!entries.has(file) || typeof scope !== 'string' || !scope || !['canonical', 'scoped', 'pointer'].includes(kind)) {
      errors.push(`${file}: invalid instruction registration`); continue;
    }
    const scopeKey = `${kind === 'pointer' ? 'pointer' : 'authority'}:${scope}`;
    if (scopes.has(scopeKey)) errors.push(`${file}: duplicate instruction scope ${scope}`);
    scopes.add(scopeKey);
    if (canonical !== 'AGENTS.md') errors.push(`${file}: missing canonical AGENTS.md reference`);
    if (kind === 'canonical' && (file !== 'AGENTS.md' || scope !== '.')) errors.push(`${file}: invalid canonical authority`);
    if (kind === 'pointer' && (file !== 'CLAUDE.md' || scope !== '.')) {
      errors.push(`${file}: pointer must be root CLAUDE.md with scope .`);
    }
    if (kind === 'scoped' && (scope === '.' || path.posix.normalize(scope) !== scope || scope.startsWith('/') || scope === '..' || scope.startsWith('../') || scope.includes('\\') || file !== `${scope}/AGENTS.md`)) {
      errors.push(`${file}: scoped AGENTS.md path must match its normalized directory scope`);
    }
  }
  if (!registry.instructions.some((item) => item?.kind === 'canonical' && item.path === 'AGENTS.md' && item.scope === '.' && item.canonical === 'AGENTS.md')) {
    errors.push('Missing root canonical instruction registration');
  }
  if (!registry.instructions.some((item) => item?.kind === 'pointer' && item.path === 'CLAUDE.md' && item.scope === '.' && item.canonical === 'AGENTS.md')) {
    errors.push('Missing CLAUDE.md canonical pointer registration');
  }
  for (const file of await discoverInstructions(root)) {
    if (!registry.instructions.some((item) => item?.path === file)) errors.push(`${file}: unregistered instruction file`);
  }
  for (const entry of registry.documents) {
    if (!entry || typeof entry !== 'object') continue;
    try {
      const document = await readContained(root, entry.path);
      const status = /^Status:\s*(?:\*\*)?(Live|Proposed|Frozen evidence|Superseded)(?=\s|[.;—*]|$)/m.exec(withoutCode(document.text));
      if (!status || status[1] !== entry.status) errors.push(`${entry.path}: visible Status must match registry ${entry.status}`);
      if (entry.status === 'Superseded') {
        if (!entries.has(entry.successor) || entries.get(entry.successor).status !== 'Live') errors.push(`${entry.path}: unresolved Live successor ${String(entry.successor)}`);
        else await readContained(root, entry.successor);
      } else if (entry.successor) errors.push(`${entry.path}: successor requires Superseded status`);
      if (registry.instructions.some((item) => item?.path === entry.path && item.kind !== 'canonical')) {
        const targets = linkTargets(document.text);
        const expected = path.posix.relative(path.posix.dirname(entry.path), 'AGENTS.md');
        if (!targets.includes(expected)) errors.push(`${entry.path}: missing link to canonical ${expected}`);
      }
      for (const target of linkTargets(document.text)) {
        try { await checkLink(root, entry.path, target); }
        catch (error) { errors.push(`${entry.path}: ${error.message}`); }
      }
    } catch (error) { errors.push(`${entry.path}: ${error.message}`); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { documents: entries.size, instructionScopes: registry.instructions.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await checkDocs();
    console.log(`Checked ${result.documents} maintained documents and ${result.instructionScopes} instruction registrations; remote URLs syntax-only; prose conflict review is manual.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
