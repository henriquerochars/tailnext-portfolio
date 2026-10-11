import type { ProfileDate } from "@/data/profile"

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function ProfileTime({ date }: { date: ProfileDate }) {
  const year = String(date.year)
  const dateTime = date.month === undefined ? year : `${year}-${String(date.month).padStart(2, "0")}`
  const label = date.month === undefined ? year : `${months[date.month - 1]} ${year}`
  return <time dateTime={dateTime}>{label}</time>
}

interface ProfilePeriodProps {
  start: ProfileDate
  end: ProfileDate | null
  expected?: boolean
}

export default function ProfilePeriod({ start, end, expected = false }: ProfilePeriodProps) {
  return (
    <>
      <ProfileTime date={start} />
      {" — "}
      {end === null ? "Present" : <ProfileTime date={end} />}
      {expected ? " (expected)" : null}
    </>
  )
}
