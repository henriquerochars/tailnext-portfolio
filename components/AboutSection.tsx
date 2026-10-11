import Image from "next/image"
import { featuredSkillIds, profileIntroduction, skills } from "@/data/profile"

const AboutSection = () => {
  return (
    <section id="about" aria-labelledby="about-heading">
      <div className="my-12 pb-12 md:pt-16 md:pb-48">
        <h2 id="about-heading" className="text-center font-bold text-4xl">
          About Me
        </h2>
        <hr className="w-6 h-1 mx-auto my-4 bg-teal-500 border-0 rounded" />

        <div className="flex flex-col space-y-10 items-stretch md:space-x-10 md:space-y-0 md:p-4 md:flex-row md:text-left">
          <div className="min-w-0 md:w-1/2">
            <h3 className="text-center text-2xl font-bold mb-6 md:text-left">
              Get to know me!
            </h3>
            <div className="space-y-6">
              {profileIntroduction.about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <div className="min-w-0 text-center md:w-1/2 md:text-left">
            <h3 id="skills-heading" className="text-2xl font-bold mb-6">My Skills</h3>
            <ul aria-labelledby="skills-heading" className="flex flex-wrap justify-center gap-2 md:justify-start">
              {featuredSkillIds.map(id => (
                <li key={id} className="max-w-full break-words rounded bg-gray-200 px-4 py-2 font-semibold text-stone-900 dark:bg-stone-700 dark:text-stone-100">
                  {skills[id].label}
                </li>
              ))}
            </ul>
            <Image
              src="/developer-hero.png"
              alt=""
              width={325}
              height={325}
              className="hidden max-w-full md:block"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
