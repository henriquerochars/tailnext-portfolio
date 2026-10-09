"use client"

import Image from "next/image"
import { HiArrowDown } from "react-icons/hi"

const HeroSection = () => {
  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

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
            Hi, I&#39;m Henrique!
          </h1>
          <p className="text-lg mt-4 mb-6 md:text-2xl">
            I&#39;m a{" "}
            <span className="font-semibold text-teal-600">
              Software Engineer{" "}
            </span>
            based in Rio de Janeiro, Brazil. Working towards creating software
            that makes life easier and more meaningful.
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center text-center">
        <button
          type="button"
          onClick={scrollToAbout}
          aria-label="Scroll to About section"
          className="cursor-pointer"
        >
          <HiArrowDown size={35} className="animate-bounce" />
        </button>
      </div>
    </section>
  )
}

export default HeroSection
