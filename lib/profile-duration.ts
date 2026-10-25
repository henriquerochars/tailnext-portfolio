import type { ProfileDate } from "../data/profile"
import type { UIStrings } from "../i18n/ui"

type DurationLabels = Pick<UIStrings, "year" | "years" | "month" | "months" | "and">

/**
 * Months spent in a role, counting both the start month and the end month
 * (the LinkedIn convention: August 2023 to February 2025 is 19 months).
 * A role without an end date counts through the month of `now`.
 */
export function monthsInclusive(start: ProfileDate, end: ProfileDate | null, now: Date): number {
  const last = end ?? { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }
  const startIndex = start.year * 12 + ((start.month ?? 1) - 1)
  const endIndex = last.year * 12 + ((last.month ?? 12) - 1)
  return Math.max(endIndex - startIndex + 1, 0)
}

export function splitMonths(totalMonths: number): { years: number; months: number } {
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 }
}

/** ISO 8601 duration for the `datetime` attribute, e.g. 19 months is `P1Y7M`. */
export function isoDuration(totalMonths: number): string {
  const { years, months } = splitMonths(totalMonths)
  if (years === 0 && months === 0) return "P0M"
  return `P${years ? `${years}Y` : ""}${months ? `${months}M` : ""}`
}

/** Human duration with explicit units, e.g. "1 year 7 months" / "1 ano e 7 meses". */
export function formatDuration(totalMonths: number, labels: DurationLabels): string {
  const { years, months } = splitMonths(totalMonths)
  const parts: string[] = []
  if (years) parts.push(`${years} ${years === 1 ? labels.year : labels.years}`)
  if (months) parts.push(`${months} ${months === 1 ? labels.month : labels.months}`)
  return parts.length ? parts.join(` ${labels.and} `) : `0 ${labels.months}`
}
