"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { RiMoonFill, RiSunLine } from "react-icons/ri"
import { IoMdMenu, IoMdClose } from "react-icons/io"
import { publicLinks } from "@/data/public-profile"
import BlogIcon from "./BlogIcon"
import LanguageSwitcher from "./LanguageSwitcher"
import { localePaths, type SiteLocale } from "@/i18n/locales"
import type { UIStrings } from "@/i18n/ui"
import { useRouter } from "next/navigation"


const subscribeToMount = () => () => {}
const clientMounted = () => true
const serverMounted = () => false

export default function Navbar({ locale, ui }: { locale: SiteLocale; ui: UIStrings }) {
  const router = useRouter()
  const blogHref = publicLinks.blog + (locale === "pt-BR" ? "" : `/${locale}`)
  const NAV_ITEMS = [
    { label: ui.home, href: "#home" }, { label: ui.about, href: "#about" },
    { label: ui.experience, href: "#experience" }, { label: ui.education, href: "#education" },
    { label: ui.latestNav, href: "#blog" }, { label: ui.blog, href: blogHref, external: true },
  ]
  function changeLocale(next: SiteLocale) {
    setNavbar(false)
    router.push(`${localePaths[next] || "/"}${window.location.search}${window.location.hash}`)
  }
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
    <header className="fixed top-0 z-50 w-full bg-white px-4 shadow sm:px-6 xl:px-8 dark:border-b dark:border-stone-600 dark:bg-stone-900">
      <div className="xl:flex xl:items-center xl:justify-between xl:gap-4 2xl:gap-6">
        <div className="flex items-center justify-between gap-3 py-3 xl:py-5">
          <a href="#home" onClick={() => setNavbar(false)} className="text-2xl font-bold">
            Henrique Rocha Dev
          </a>
          <button
            ref={menuButton}
            type="button"
            aria-label={navbar ? ui.closeMenu : ui.openMenu}
            aria-expanded={navbar}
            aria-controls="primary-navigation"
            className="shrink-0 rounded-md p-2 text-stone-700 xl:hidden dark:text-stone-200"
            onClick={() => setNavbar(open => !open)}
          >
            {navbar ? <IoMdClose size={30} /> : <IoMdMenu size={30} />}
          </button>
        </div>
        <nav
          id="primary-navigation"
          aria-label={ui.navigation}
          className={`max-h-[calc(100dvh-5rem)] overflow-y-auto pb-3 xl:block xl:overflow-visible xl:pb-0 ${navbar ? "block" : "hidden"}`}
        >
          <ul className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-3 2xl:gap-4">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onClick={() => setNavbar(false)}
                  className="flex min-h-11 items-center gap-2 whitespace-nowrap text-neutral-900 hover:text-neutral-500 dark:text-neutral-100"
                >
                  {item.external && <BlogIcon className="h-5 w-5 shrink-0" />}
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                aria-label={currentTheme === "dark" ? ui.lightTheme : ui.darkTheme}
                disabled={!mounted}
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-300 p-2 text-black"
              >
                {currentTheme === "dark" ? <RiSunLine size={25} /> : <RiMoonFill size={25} />}
              </button>
            </li>
            <li><LanguageSwitcher locale={locale} label={ui.language} onLocaleChange={changeLocale} /></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
