import type { ProfileDate } from "@/data/profile"
import { formatDuration, isoDuration, monthsInclusive } from "@/lib/profile-duration"
import type { UIStrings } from "@/i18n/ui"

interface ProfileDurationProps {
  start: ProfileDate
  end: ProfileDate | null
  now: Date
  ui: UIStrings
}

export default function ProfileDuration({ start, end, now, ui }: ProfileDurationProps) {
  const months = monthsInclusive(start, end, now)
  return <>{ui.duration}: <time dateTime={isoDuration(months)}>{formatDuration(months, ui)}</time></>
}
