import type { Messages } from "@/i18n/messages"
import type { SiteLocale } from "@/i18n/locales"
import { CareerTimeline, CareerTimelineItem } from "./CareerTimeline"
import ProfilePeriod from "./ProfilePeriod"
import SkillsList from "./SkillsList"

export default function EducationSection({ messages, locale }: { messages: Messages; locale: SiteLocale }) {
  const { education, ui } = messages
  return (
    <section id="education" aria-labelledby="education-heading" className="py-12 md:py-16">
      <h2 id="education-heading" className="text-center text-4xl font-bold">{ui.education}</h2>
      <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
      <CareerTimeline label={ui.academic}>
        {education.map(entry => (
          <CareerTimelineItem
            key={entry.id}
            id={`education-${entry.id}`}
            title={entry.program}
            subtitle={entry.institution}
            period={<ProfilePeriod start={entry.start} end={entry.end} expected={entry.status === "in-progress"} locale={locale} ui={ui} />}
          >
            <p>{entry.field}</p>
            {entry.status === "in-progress" ? <p className="font-semibold text-teal-700 dark:text-teal-400">{ui.inProgress}</p> : null}
            {entry.skillAssociations.status === "verified" ? (
              <SkillsList skillIds={entry.skillAssociations.skillIds} label={`${ui.skillsAt} ${entry.institution}`} labels={messages.skillLabels} />
            ) : null}
          </CareerTimelineItem>
        ))}
      </CareerTimeline>
    </section>
  )
}
