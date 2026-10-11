import { education } from "@/data/profile"
import { CareerTimeline, CareerTimelineItem } from "./CareerTimeline"
import ProfilePeriod from "./ProfilePeriod"
import SkillsList from "./SkillsList"

export default function EducationSection() {
  return (
    <section id="education" aria-labelledby="education-heading">
      <h2 id="education-heading" className="section-heading"><span aria-hidden="true">03</span>Education</h2>
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
            {entry.status === "in-progress" ? <p className="education-status">In progress</p> : null}
            {entry.skillAssociations.status === "verified" ? (
              <SkillsList skillIds={entry.skillAssociations.skillIds} label={`Skills at ${entry.institution}`} />
            ) : null}
          </CareerTimelineItem>
        ))}
      </CareerTimeline>
    </section>
  )
}
