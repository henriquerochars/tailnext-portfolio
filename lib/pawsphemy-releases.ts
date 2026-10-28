import type { PawsphemyRelease } from "@/data/pawsphemy-releases"
import type { SiteLocale } from "@/i18n/locales"

export function filterReleases(releases: PawsphemyRelease[], locale: SiteLocale, search = "", from = "", to = "") {
  return [...releases].sort((a, b) => b.date.localeCompare(a.date)).filter(release =>
    release.name.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)) &&
    (!from || release.date >= from) && (!to || release.date <= to))
}

export function releasePage(releases: PawsphemyRelease[], page: number) {
  return releases.slice((page - 1) * 10, page * 10)
}
