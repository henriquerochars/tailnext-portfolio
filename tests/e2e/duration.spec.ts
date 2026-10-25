import { expect, test } from "@playwright/test"
import { employment } from "../../data/profile"
import { englishUI, portugueseUI, spanishUI } from "../../i18n/ui"
import { formatDuration, isoDuration, monthsInclusive } from "../../lib/profile-duration"

const now = new Date("2026-10-25T12:00:00Z")

test("counts both the start and the end month of a role", () => {
  expect(monthsInclusive({ year: 2023, month: 8 }, { year: 2025, month: 2 }, now)).toBe(19)
  expect(monthsInclusive({ year: 2022, month: 7 }, { year: 2023, month: 7 }, now)).toBe(13)
  expect(monthsInclusive({ year: 2019, month: 8 }, { year: 2019, month: 11 }, now)).toBe(4)
  expect(monthsInclusive({ year: 2018, month: 7 }, { year: 2019, month: 6 }, now)).toBe(12)
  expect(monthsInclusive({ year: 2026, month: 10 }, { year: 2026, month: 10 }, now)).toBe(1)
})

test("counts a role without an end date through the current month", () => {
  expect(monthsInclusive({ year: 2025, month: 2 }, null, now)).toBe(21)
  expect(monthsInclusive({ year: 2025, month: 2 }, null, new Date("2026-11-01T00:00:00Z"))).toBe(22)
})

test("formats explicit units with correct plurals in every language", () => {
  expect(formatDuration(19, englishUI)).toBe("1 year and 7 months")
  expect(formatDuration(19, portugueseUI)).toBe("1 ano e 7 meses")
  expect(formatDuration(19, spanishUI)).toBe("1 año y 7 meses")
  expect(formatDuration(4, englishUI)).toBe("4 months")
  expect(formatDuration(1, englishUI)).toBe("1 month")
  expect(formatDuration(12, englishUI)).toBe("1 year")
  expect(formatDuration(26, englishUI)).toBe("2 years and 2 months")
  expect(formatDuration(0, englishUI)).toBe("0 months")
})

test("exposes an ISO 8601 duration for machines", () => {
  expect(isoDuration(19)).toBe("P1Y7M")
  expect(isoDuration(4)).toBe("P4M")
  expect(isoDuration(24)).toBe("P2Y")
  expect(isoDuration(0)).toBe("P0M")
})

test("every employment entry has a positive duration", () => {
  for (const entry of employment) expect(monthsInclusive(entry.start, entry.end, now)).toBeGreaterThan(0)
  expect(employment.map(entry => formatDuration(monthsInclusive(entry.start, entry.end, now), englishUI))).toEqual([
    "1 year and 9 months", "1 year and 7 months", "1 year and 1 month", "5 months", "1 year",
    "1 year and 5 months", "4 months", "1 year and 2 months", "10 months",
  ])
})
