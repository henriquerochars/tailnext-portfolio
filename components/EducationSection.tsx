import { education } from "@/data/profile"
import { CareerTimeline, CareerTimelineItem } from "./CareerTimeline"
import ProfilePeriod from "./ProfilePeriod"
import SkillsList from "./SkillsList"

export default function EducationSection() {
  return (
    <section id="education" aria-labelledby="education-heading" className="py-12 md:py-16">
      <h2 id="education-heading" className="text-center text-4xl font-bold">Education</h2>
      <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
      <CareerTimeline label="Academic background">
        {education.map(entry => (
          <CareerTimelineItem
            key={entry.id}
            id={`education-${entry.id}`}
            title={entry.program}
            subtitle={entry.institution}
            period={<ProfilePeriod start={entry.start} end={entry.end} expected={entry.status === "in-progress"} />}
          >
            <p>{entry.field}</p>
            {entry.status === "in-progress" ? <p className="font-semibold text-teal-700 dark:text-teal-400">In progress</p> : null}
            {entry.skillAssociations.status === "verified" ? (
              <SkillsList skillIds={entry.skillAssociations.skillIds} label={`Skills at ${entry.institution}`} />
            ) : null}
          </CareerTimelineItem>
        ))}
      </CareerTimeline>
    </section>
  )
}
