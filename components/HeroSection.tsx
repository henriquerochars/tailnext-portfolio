import Image from "next/image"
import { HiArrowDown } from "react-icons/hi"
import type { Messages } from "@/i18n/messages"

const HeroSection = ({ messages }: { messages: Messages }) => {
  const { introduction: profileIntroduction, ui } = messages
  return (
    <section id="home">
      <div className="flex flex-col text-center items-center justify-center my-10 py-16 sm:py-32 md:py-48 md:flex-row md:space-x-4 md:text-left">
        <div className="md:mt-2 md:w-1/2">
          <Image
            src="/perfil.jpeg"
            alt="Henrique Rocha"
            width={325}
            height={325}
            className="rounded-full shadow-2xl"
          />
        </div>
        <div className="md:mt-2 md:w-3/5">
          <h1 className="text-4xl font-bold mt-6 md:mt-0 md:text-7xl">
            {profileIntroduction.greeting}
          </h1>
          <p className="text-lg mt-4 mb-6 md:text-2xl">
            {ui.rolePrefix}{" "}
            <span className="font-semibold text-teal-600">
              {profileIntroduction.role}
            </span>
            {" "}{ui.at} {profileIntroduction.employer}, {ui.based} {profileIntroduction.location}.
            {" "}{profileIntroduction.hero}
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center text-center">
        <a
          href="#about"
          aria-label={ui.scrollAbout}
          className="cursor-pointer"
        >
          <HiArrowDown size={35} className="motion-safe:animate-bounce" />
        </a>
      </div>
    </section>
  )
}

export default HeroSection
