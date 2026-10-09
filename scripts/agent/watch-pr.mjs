import { deliveryReadiness } from './deliver-pr.mjs';
export async function watchReadiness(readSnapshot, { attempts = 3, intervalMs = 1000, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10 || intervalMs < 0 || intervalMs > 30_000) throw new Error('Invalid bounded watch');
  let result;
  for (let attempt = 0; attempt < attempts; attempt++) {
    result = deliveryReadiness(await readSnapshot());
    if (result.ready) return result;
    if (attempt + 1 < attempts) await wait(intervalMs);
  }
  return { ...result, polling: 'bounded-pending' };
}
