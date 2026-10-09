import { classifyCommand } from './command-policy.mjs';
export function offlineAdapter(payload, policy, client) {
  if (!['codex','claude'].includes(client) || payload?.event !== 'command' || !Array.isArray(payload.argv)) throw new Error('Unsupported offline event');
  return { client, installed: false, nativeEnforcement: 'unverified', recommendation: classifyCommand(payload.argv, policy) };
}
