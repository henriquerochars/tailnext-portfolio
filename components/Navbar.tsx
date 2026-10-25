"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { RiMoonFill, RiSunLine } from "react-icons/ri"
import { IoMdMenu, IoMdClose } from "react-icons/io"
import { publicLinks } from "@/data/public-profile"
import BlogIcon from "./BlogIcon"

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Last 5 posts", href: "#blog" },
  { label: "Blog pt-br", href: publicLinks.blog, external: true },
]

const subscribeToMount = () => () => {}
const clientMounted = () => true
const serverMounted = () => false

export default function Navbar() {
  const { systemTheme, theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribeToMount, clientMounted, serverMounted)
  const currentTheme = mounted ? (theme === "system" ? systemTheme : theme) : "light"
  const [navbar, setNavbar] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!navbar) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setNavbar(false)
      if (menuButton.current?.getClientRects().length) menuButton.current.focus()
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [navbar])

  return (
    <header className="fixed top-0 z-50 w-full bg-white px-4 shadow sm:px-6 lg:px-8 dark:border-b dark:border-stone-600 dark:bg-stone-900">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-4 xl:gap-6">
        <div className="flex items-center justify-between gap-3 py-3 lg:py-5">
          <a href="#home" onClick={() => setNavbar(false)} className="text-2xl font-bold">
            Henrique Rocha Dev
          </a>
          <button
            ref={menuButton}
            type="button"
            aria-label={navbar ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={navbar}
            aria-controls="primary-navigation"
            className="shrink-0 rounded-md p-2 text-stone-700 lg:hidden dark:text-stone-200"
            onClick={() => setNavbar(open => !open)}
          >
            {navbar ? <IoMdClose size={30} /> : <IoMdMenu size={30} />}
          </button>
        </div>
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={`max-h-[calc(100dvh-5rem)] overflow-y-auto pb-3 lg:block lg:overflow-visible lg:pb-0 ${navbar ? "block" : "hidden"}`}
        >
          <ul className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3 xl:gap-4">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onClick={() => setNavbar(false)}
                  className="flex min-h-11 items-center gap-2 whitespace-nowrap text-neutral-900 hover:text-neutral-500 dark:text-neutral-100"
                >
                  {item.external && <BlogIcon className="h-5 w-6 shrink-0" />}
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                aria-label={currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                disabled={!mounted}
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-300 p-2 text-black"
              >
                {currentTheme === "dark" ? <RiSunLine size={25} /> : <RiMoonFill size={25} />}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
