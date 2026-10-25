import type { Messages } from "@/i18n/messages"
import type { SiteLocale } from "@/i18n/locales"
import { CareerTimeline, CareerTimelineItem } from "./CareerTimeline"
import ProfileDuration from "./ProfileDuration"
import ProfilePeriod from "./ProfilePeriod"
import SkillsList from "./SkillsList"

export default function ExperienceSection({ messages, locale }: { messages: Messages; locale: SiteLocale }) {
  const { employment, ui } = messages
  // The current role counts through this month; the page is regenerated daily (see page.tsx).
  const now = new Date()
  return (
    <section id="experience" aria-labelledby="experience-heading" className="py-12 md:py-16">
      <h2 id="experience-heading" className="text-center text-4xl font-bold">{ui.experience}</h2>
      <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
      <CareerTimeline label={ui.professional}>
        {employment.map(entry => (
          <CareerTimelineItem
            key={entry.id}
            id={`experience-${entry.id}`}
            title={entry.role}
            subtitle={entry.employer}
            period={<ProfilePeriod start={entry.start} end={entry.end} locale={locale} ui={ui} />}
            duration={<ProfileDuration start={entry.start} end={entry.end} now={now} ui={ui} />}
          >
            {entry.description.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {entry.skillAssociations.status === "verified" ? (
              <SkillsList skillIds={entry.skillAssociations.skillIds} label={`${ui.skillsAt} ${entry.employer}`} labels={messages.skillLabels} />
            ) : null}
          </CareerTimelineItem>
        ))}
      </CareerTimeline>
    </section>
  )
}
