import { readFile } from 'node:fs/promises';
import { runOwned, requireSuccess } from './process.mjs';
import { commandVector } from './run-yarn.mjs';
import { verify } from './check-changed.mjs';
import { sessionContext, withLease, loadSetup, childEnvironment } from './bootstrap.mjs';

export function parseDoneWhen(body) {
  if (typeof body !== 'string') throw new Error('Acceptance body required');
  const headings = [...body.matchAll(/^## Done when\s*$/gim)];
  if (headings.length !== 1) throw new Error('Exactly one Done when section required');
  const remainder = body.slice(headings[0].index + headings[0][0].length);
  const section = remainder.split(/^## /m)[0];
  const criteria = [];
  for (const line of section.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = /^- \[[ xX]\] (run|check|human): (\S[^\r\n]*)$/.exec(line);
    if (!match) throw new Error('Malformed typed acceptance criterion');
    criteria.push({ type: match[1], text: match[2] });
  }
  if (!criteria.length || new Set(criteria.map(c => `${c.type}:${c.text}`)).size !== criteria.length) throw new Error('Empty/duplicate acceptance');
  return criteria;
}
export function validateAcceptance(body, commands, gates) {
  if (commands?.version !== 1 || !Array.isArray(commands.commands)) throw new Error('Invalid reviewed command registry');
  const registry = new Map(commands.commands.map(command => [command.display, command]));
  if (registry.size !== commands.commands.length) throw new Error('Duplicate reviewed command');
  for (const command of commands.commands) {
    if (!command.display || !Array.isArray(command.argv) || !['node','yarn'].includes(command.argv[0])
      || command.argv.some(arg => typeof arg !== 'string' || !arg || /[\0\n\r;&|`<>]|\$\(/.test(arg) || arg.startsWith('/') || arg.startsWith('../'))
      || !Number.isInteger(command.timeoutSeconds) || command.timeoutSeconds < 1 || command.timeoutSeconds > 300) throw new Error('Unsafe reviewed command vector');
  }
  return parseDoneWhen(body).map(criterion => {
    if (criterion.type === 'human') return { ...criterion, status: 'pending-human' };
    if (criterion.type === 'check') {
      if (![gates.summaryCheck, ...gates.gates.map(gate => gate.id)].includes(criterion.text)) throw new Error('Unknown check criterion');
      return { ...criterion, status: 'pending-current-check' };
    }
    const command = registry.get(criterion.text);
    if (!command) throw new Error('Unknown or injected run criterion');
    return { ...criterion, argv: command.argv, timeoutSeconds: command.timeoutSeconds };
  });
}
export async function executeAcceptance({ body, root, revision, receipt, args }) {
  if (!/^[a-f0-9]{40}$/.test(revision) || receipt?.status !== 'passed' || receipt.source?.head !== revision || Date.now() - receipt.finishedAt > 30 * 60_000) throw new Error('Current revision verification required');
  if (args?.revision !== revision) throw new Error('Current revision/session arguments required');
  await verify(root, { ...args, reuse: true });
  const context = await sessionContext(root, args);
  return withLease(context, async () => {
    const setup = await loadSetup(context);
    const commands = JSON.parse(await readFile(`${root}/config/harness/acceptance-commands.json`));
    const gates = JSON.parse(await readFile(`${root}/config/harness/ci-gates.json`));
    const results = [];
    for (const criterion of validateAcceptance(body, commands, gates)) {
      if (criterion.type !== 'run') { results.push(criterion); continue; }
      requireSuccess(await runOwned(commandVector(criterion.argv, context.tools), { cwd: setup.work, env: childEnvironment(context.tools, context.directory), timeoutMs: criterion.timeoutSeconds * 1000 }), criterion.text);
      results.push({ ...criterion, status: 'passed', revision });
    }
    return results;
  });
}
