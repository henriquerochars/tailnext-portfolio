import { employment, type Employment } from "@/data/profile"
import { CareerTimeline, CareerTimelineItem } from "./CareerTimeline"
import ProfilePeriod from "./ProfilePeriod"
import SkillsList from "./SkillsList"

function EmploymentEntry({ entry }: { entry: Employment }) {
  return (
    <CareerTimelineItem id={`experience-${entry.id}`} title={entry.role} subtitle={entry.employer} period={<ProfilePeriod start={entry.start} end={entry.end} />}>
      {entry.description.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {entry.skillAssociations.status === "verified" ? <SkillsList skillIds={entry.skillAssociations.skillIds} label={`Skills at ${entry.employer}`} /> : null}
    </CareerTimelineItem>
  )
}

export default function ExperienceSection() {
  const recent = employment.slice(0, 3)
  const earlier = employment.slice(3)
  return (
    <section id="experience" aria-labelledby="experience-heading">
      <h2 id="experience-heading" className="section-heading"><span aria-hidden="true">02</span>Experience</h2>
      <CareerTimeline label="Professional experience">
        {recent.map(entry => <EmploymentEntry key={entry.id} entry={entry} />)}
      </CareerTimeline>
      {earlier.length > 0 ? (
        <details className="earlier-experience">
          <summary>
            <span className="disclosure-closed">Show {earlier.length} earlier roles</span>
            <span className="disclosure-open">Hide {earlier.length} earlier roles</span>
          </summary>
          <CareerTimeline label="Earlier professional experience" start={recent.length + 1}>
            {earlier.map(entry => <EmploymentEntry key={entry.id} entry={entry} />)}
          </CareerTimeline>
        </details>
      ) : null}
    </section>
  )
}
