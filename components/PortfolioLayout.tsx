"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Navbar, { sections, type SectionId } from "./Navbar"

export default function PortfolioLayout({ profile, children }: { profile: ReactNode; children: ReactNode }) {
  const profileRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const [sticky, setSticky] = useState(false)
  const [active, setActive] = useState<SectionId | null>(null)

  useEffect(() => {
    const profileElement = profileRef.current
    const content = contentRef.current
    if (!profileElement || !content) return
    let frame = 0
    const update = () => {
      frame = 0
      const desktop = window.innerWidth >= 1280
      setSticky(desktop && profileElement.offsetHeight <= window.innerHeight - 48)
      const offset = desktop ? 24 : 88
      const entries = sections.flatMap(section => {
        const element = document.getElementById(section.id)
        return element ? [{ id: section.id, rect: element.getBoundingClientRect() }] : []
      })
      let current: SectionId | null = null
      for (const entry of entries) {
        // Fragment scrolling can settle on a fractional CSS pixel.
        if (entry.rect.top <= offset + 1) current = entry.id
      }
      // Short final sections may never reach the reading line at the document's end.
      const last = entries[entries.length - 1]
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      if (atEnd && last && last.rect.top < window.innerHeight) current = last.id
      if (!current) current = entries.find(entry => entry.rect.top < window.innerHeight / 2 && entry.rect.bottom > offset)?.id ?? null
      setActive(current)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const revealFragment = () => {
      let id: string
      try { id = decodeURIComponent(window.location.hash.slice(1)) } catch { return }
      const target = document.getElementById(id)
      const disclosure = target?.closest("details")
      if (disclosure && !disclosure.open) {
        disclosure.open = true
        target?.scrollIntoView()
      }
      schedule()
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(profileElement)
    observer.observe(content)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("hashchange", revealFragment)
    content.addEventListener("toggle", schedule, true)
    revealFragment()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("hashchange", revealFragment)
      content.removeEventListener("toggle", schedule, true)
    }
  }, [])

  return (
    <>
      <Navbar active={active} mobile />
      <div id="home" className="portfolio-grid">
        <aside className="profile-column" aria-label="Profile">
          <div ref={profileRef} className="profile-content" data-sticky={sticky}>
            {profile}
            <Navbar active={active} />
          </div>
        </aside>
        <main id="main-content" ref={contentRef} className="reading-content" tabIndex={-1}>{children}</main>
      </div>
    </>
  )
}
