import { employment } from "@/data/profile"
import { CareerTimeline, CareerTimelineItem } from "./CareerTimeline"
import ProfilePeriod from "./ProfilePeriod"
import SkillsList from "./SkillsList"

export default function ExperienceSection() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="py-12 md:py-16">
      <h2 id="experience-heading" className="text-center text-4xl font-bold">Experience</h2>
      <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
      <CareerTimeline label="Professional experience">
        {employment.map(entry => (
          <CareerTimelineItem
            key={entry.id}
            id={`experience-${entry.id}`}
            title={entry.role}
            subtitle={entry.employer}
            period={<ProfilePeriod start={entry.start} end={entry.end} />}
          >
            {entry.description.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {entry.skillAssociations.status === "verified" ? (
              <SkillsList skillIds={entry.skillAssociations.skillIds} label={`Skills at ${entry.employer}`} />
            ) : null}
          </CareerTimelineItem>
        ))}
      </CareerTimeline>
    </section>
  )
}
