"use client"

import { useRef, useState } from "react"
import { pawsphemyReleases, type PawsphemyRelease } from "@/data/pawsphemy-releases"
import { filterReleases, releasePage } from "@/lib/pawsphemy-releases"
import type { SiteLocale } from "@/i18n/locales"

const copy = {
  en: { title: "Pawsphemy patch notes", empty: "No releases published yet. Check back soon.", archive: "View release archive", close: "Close archive", search: "Search by name", from: "From date", to: "To date", noResults: "No releases match these filters.", previous: "Previous", next: "Next", page: "Page" },
  "pt-BR": { title: "Notas de atualização do Pawsphemy", empty: "Ainda não há versões publicadas. Volte em breve.", archive: "Ver arquivo de versões", close: "Fechar arquivo", search: "Buscar por nome", from: "Data inicial", to: "Data final", noResults: "Nenhuma versão corresponde aos filtros.", previous: "Anterior", next: "Próxima", page: "Página" },
  es: { title: "Notas de actualización de Pawsphemy", empty: "Todavía no hay versiones publicadas. Vuelve pronto.", archive: "Ver archivo de versiones", close: "Cerrar archivo", search: "Buscar por nombre", from: "Fecha inicial", to: "Fecha final", noResults: "Ninguna versión coincide con los filtros.", previous: "Anterior", next: "Siguiente", page: "Página" },
}

function Release({ release, locale }: { release: PawsphemyRelease; locale: SiteLocale }) {
  return <article className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-stone-700 dark:bg-stone-800/50">
    <time dateTime={release.date} className="text-sm text-neutral-600 dark:text-neutral-300">{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${release.date}T00:00:00Z`))}</time>
    <h3 className="mt-2 text-xl font-semibold">{release.name}</h3>
    <p className="mt-3 whitespace-pre-wrap leading-relaxed">{release.explanation}</p>
    {release.gifs.map(gif => <img key={gif.src} src={gif.src} alt={gif.alt} loading="lazy" className="mt-4 h-auto max-w-full rounded" />)}
  </article>
}

export default function PawsphemySection({ locale, releases: releaseData = pawsphemyReleases }: { locale: SiteLocale; releases?: PawsphemyRelease[] }) {
  const t = copy[locale]
  const dialog = useRef<HTMLDialogElement>(null)
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const releases = filterReleases(releaseData, locale)
  const filtered = filterReleases(releases, locale, search, from, to)
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const inputClass = "block w-full rounded border border-neutral-400 bg-white p-2 text-neutral-900 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
  return <section id="pawsphemy" aria-labelledby="pawsphemy-heading" className="py-12 md:py-16">
    <h2 id="pawsphemy-heading" className="text-center text-3xl font-bold sm:text-4xl">{t.title}</h2>
    <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
    {releases.length ? <div className="space-y-4">{releases.slice(0, 5).map(release => <Release key={`${release.date}-${release.name}`} release={release} locale={locale} />)}</div> : <p className="py-6 text-center">{t.empty}</p>}
    <div className="mt-8 text-center"><button type="button" onClick={() => dialog.current?.showModal()} className="min-h-11 px-4 font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-400">{t.archive}</button></div>
    <dialog ref={dialog} aria-labelledby="archive-heading" className="m-auto max-h-[90vh] w-[min(90vw,48rem)] rounded-xl bg-white p-6 text-neutral-900 shadow-xl backdrop:bg-black/60 dark:bg-stone-900 dark:text-white">
      <div className="flex items-start justify-between gap-4"><h2 id="archive-heading" className="text-2xl font-bold">{t.archive}</h2><button type="button" onClick={() => dialog.current?.close()} className="min-h-11 underline">{t.close}</button></div>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        <label>{t.search}<input className={inputClass} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></label>
        <label>{t.from}<input type="date" className={inputClass} value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} /></label>
        <label>{t.to}<input type="date" className={inputClass} value={to} onChange={e => { setTo(e.target.value); setPage(1) }} /></label>
      </div>
      <div aria-live="polite" className="space-y-4">{filtered.length ? releasePage(filtered, page).map(release => <Release key={`${release.date}-${release.name}`} release={release} locale={locale} />) : <p>{releases.length ? t.noResults : t.empty}</p>}</div>
      {filtered.length > 10 && <div className="mt-6 flex items-center justify-between gap-4"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-11 underline disabled:opacity-50">{t.previous}</button><span>{t.page} {page} / {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="min-h-11 underline disabled:opacity-50">{t.next}</button></div>}
    </dialog>
  </section>
}
