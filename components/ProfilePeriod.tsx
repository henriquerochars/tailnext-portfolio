import type { ProfileDate } from "@/data/profile"
import type { SiteLocale } from "@/i18n/locales"
import type { UIStrings } from "@/i18n/ui"

function ProfileTime({ date, locale }: { date: ProfileDate; locale: SiteLocale }) {
  const year = String(date.year)
  const dateTime = date.month === undefined ? year : `${year}-${String(date.month).padStart(2, "0")}`
  const label = date.month === undefined ? year : new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(date.year, date.month - 1, 1)))
  return <time dateTime={dateTime}>{label}</time>
}
interface ProfilePeriodProps {
  start: ProfileDate
  end: ProfileDate | null
  expected?: boolean
  locale: SiteLocale
  ui: UIStrings
}
export default function ProfilePeriod({ start, end, expected = false, locale, ui }: ProfilePeriodProps) {
  return <><ProfileTime date={start} locale={locale} />{" — "}{end === null ? ui.present : <ProfileTime date={end} locale={locale} />}{expected ? ` (${ui.expected})` : null}</>
}
