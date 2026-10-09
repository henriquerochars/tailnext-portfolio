// Pure delivery assessment: never pushes, merges, deploys or fabricates review.
export function deliveryReadiness({ head, base, integration, receipt, check, review, protection, preview, now = Date.now() }) {
  const pending = [];
  if (![head, base, integration].every(sha => /^[a-f0-9]{40}$/.test(sha ?? ''))) pending.push('exact revisions');
  if (receipt?.status !== 'passed' || receipt.source?.head !== head || receipt.source?.base !== base
    || !Number.isFinite(receipt.finishedAt) || now < receipt.finishedAt || now - receipt.finishedAt > 30 * 60_000) pending.push('current local receipt');
  if (check?.name !== 'required-summary' || check.conclusion !== 'success' || check.source !== head || check.base !== base || check.integration !== integration) pending.push('current Actions summary');
  if (review?.revision !== head || review.status !== 'approved' || !review.reviewer) pending.push('independent exact-revision review');
  if (preview?.state !== 'READY' || preview.revision !== head || preview.project !== 'prj_wwKpcXE1x4QY49tFcVJxtgAwhQOv' || preview.browser !== 'passed') pending.push('current tested Vercel Preview');
  if (protection !== 'verified-enforced') pending.push('administrator protection evidence');
  return { ready: pending.length === 0, pending, actions: [], publication: 'dry-run-only' };
}
