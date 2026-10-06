"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { RiMoonFill, RiSunLine } from "react-icons/ri"
import { IoMdMenu, IoMdClose } from "react-icons/io"

interface NavItem {
  label: string
  page: string
  external?: boolean
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Home",
    page: "home",
  },
  {
    label: "About",
    page: "about",
  },
  {
    label: "Blog pt-br",
    page: "https://henriquerochadevblog.vercel.app",
    external: true,
  },
]

export default function Navbar() {
  const { systemTheme, theme, setTheme } = useTheme()
  const currentTheme = theme === "system" ? systemTheme : theme
  const [navbar, setNavbar] = useState(false)

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
    setNavbar(false)
  }

  return (
    <header className="w-full mx-auto px-4 sm:px-20 fixed top-0 z-50 shadow bg-white dark:bg-stone-900 dark:border-b dark:border-stone-600">
      <div className="justify-between md:items-center md:flex">
        <div>
          <div className="flex items-center justify-between py-3 md:py-5 md:block">
            <button
              type="button"
              onClick={() => scrollToSection("home")}
              className="container flex items-center space-x-2"
            >
              <h2 className="text-2xl font-bold">Henrique Rocha Dev</h2>
            </button>
            <div className="md:hidden">
              <button
                type="button"
                aria-label={navbar ? "Close navigation menu" : "Open navigation menu"}
                className="p-2 text-gray-700 rounded-md outline-none focus:border-gray-400 focus:border"
                onClick={() => setNavbar(!navbar)}
              >
                {navbar ? <IoMdClose size={30} /> : <IoMdMenu size={30} />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`flex-1 justify-self-center pb-3 mt-8 md:block md:pb-0 md:mt-0 ${
              navbar ? "block" : "hidden"
            }`}
          >
            <div className="items-center justify-center space-y-8 md:flex md:space-x-6 md:space-y-0">
              {NAV_ITEMS.map((item) =>
                item.external ? (
                  <a
                    href={item.page}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={item.label}
                    className="cursor-pointer block lg:inline-block text-neutral-900 hover:text-neutral-500 dark:text-neutral-100"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => scrollToSection(item.page)}
                    className="cursor-pointer block lg:inline-block text-neutral-900 hover:text-neutral-500 dark:text-neutral-100"
                  >
                    {item.label}
                  </button>
                )
              )}
              {currentTheme === "dark" ? (
                <button
                  type="button"
                  aria-label="Switch to light theme"
                  onClick={() => setTheme("light")}
                  className="bg-slate-300 p-2 rounded-xl"
                >
                  <RiSunLine size={25} color="black" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Switch to dark theme"
                  onClick={() => setTheme("dark")}
                  className="bg-slate-300 p-2 rounded-xl"
                >
                  <RiMoonFill size={25} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
