"use client"

import { useEffect, useRef, useState } from "react"
import { IoMdMenu, IoMdClose } from "react-icons/io"
import { HiArrowUpRight } from "react-icons/hi2"
import { publicLinks } from "@/data/public-profile"
import ThemeControl from "./ThemeControl"

export const sections = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
] as const

export type SectionId = typeof sections[number]["id"]

function SectionLinks({ active, onNavigate }: { active: SectionId | null; onNavigate?: () => void }) {
  return (
    <ul className="section-links">
      {sections.map((item, index) => (
        <li key={item.id}>
          <a href={`#${item.id}`} onClick={onNavigate} aria-current={active === item.id ? "location" : undefined}>
            <span className="nav-rule" aria-hidden="true" />
            <span className="nav-number" aria-hidden="true">0{index + 1}</span>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

function BlogLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <a className="blog-link" href={publicLinks.blog} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
      Blog pt-br <HiArrowUpRight size={16} aria-hidden="true" />
    </a>
  )
}

export default function Navbar({ active, mobile = false }: { active: SectionId | null; mobile?: boolean }) {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!mobile || !open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      menuButton.current?.focus()
    }
    const desktop = window.matchMedia("(min-width: 1280px)")
    const closeOnDesktop = () => {
      if (!desktop.matches) return
      const focused = document.activeElement
      if (focused instanceof HTMLAnchorElement && menu.current?.contains(focused)) {
        document.querySelector<HTMLAnchorElement>(`.desktop-navigation a[href="${focused.getAttribute("href")}"]`)?.focus()
      }
      setOpen(false)
    }
    document.addEventListener("keydown", closeOnEscape)
    desktop.addEventListener("change", closeOnDesktop)
    return () => {
      document.removeEventListener("keydown", closeOnEscape)
      desktop.removeEventListener("change", closeOnDesktop)
    }
  }, [mobile, open])

  if (!mobile) {
    return (
      <div className="desktop-navigation">
        <nav aria-label="Main navigation"><SectionLinks active={active} /></nav>
        <div className="profile-utilities"><BlogLink /><ThemeControl /></div>
      </div>
    )
  }

  return (
    <header className="mobile-navigation">
      <div className="mobile-bar">
        <a className="mobile-identity" href="#home" aria-label="Home" onClick={() => setOpen(false)}>Henrique Rocha Dev</a>
        <ThemeControl />
        <button ref={menuButton} className="menu-toggle" type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(value => !value)}>
          {open ? <IoMdClose size={24} aria-hidden="true" /> : <IoMdMenu size={24} aria-hidden="true" />}
        </button>
      </div>
      <nav ref={menu} id="mobile-menu" aria-label="Main navigation" className="mobile-menu" hidden={!open}>
        <SectionLinks active={active} onNavigate={() => setOpen(false)} />
        <BlogLink onNavigate={() => setOpen(false)} />
      </nav>
    </header>
  )
}
