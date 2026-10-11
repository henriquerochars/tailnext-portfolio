import Image from "next/image"
import { featuredSkillIds, profileIntroduction } from "@/data/profile"
import SkillsList from "./SkillsList"

export default function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-heading">
      <h2 id="about-heading" className="section-heading"><span aria-hidden="true">01</span>About Me</h2>
      <h3 className="about-heading">Get to know me!</h3>
      <div className="about-copy">
        {profileIntroduction.about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="featured-skills">
        <h3 id="skills-heading">My Skills</h3>
        <SkillsList skillIds={featuredSkillIds} label="My Skills" />
      </div>
      <Image src="/developer-hero.png" alt="" width={160} height={160} className="about-illustration" />
    </section>
  )
}
