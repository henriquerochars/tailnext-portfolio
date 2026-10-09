import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readContained } from './files.mjs';

export const SKILLS = ['start-task', 'review-change', 'deliver-task', 'capture-learning', 'implement-ticket'];
export async function validateSkills(root = process.cwd()) {
  const routing = JSON.parse((await readContained(root, 'scripts/agent/context-routing.json')).text);
  if (routing.version !== 1 || routing.boards !== 'disabled' || JSON.stringify(Object.keys(routing.skills).sort()) !== JSON.stringify([...SKILLS].sort())) throw new Error('Unknown/missing skill routing or board authority');
  const found = (await readdir(path.join(root, '.agents/skills'))).sort();
  if (JSON.stringify(found) !== JSON.stringify([...SKILLS].sort())) throw new Error('Unregistered lifecycle skill');
  for (const name of SKILLS) {
    const { text } = await readContained(root, `.agents/skills/${name}/SKILL.md`);
    if (!text.startsWith(`---\nname: ${name}\ndescription: `) || !text.includes('\n---\n') || !text.includes('AGENTS.md')) throw new Error(`Invalid lifecycle skill: ${name}`);
    const files = routing.skills[name];
    if (!Array.isArray(files) || !files.length || new Set(files).size !== files.length) throw new Error(`Invalid context route: ${name}`);
    for (const file of files) await readContained(root, file);
  }
  return { skills: SKILLS.length, boards: 'disabled', nativeDiscovery: 'not-proven' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(await validateSkills()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
