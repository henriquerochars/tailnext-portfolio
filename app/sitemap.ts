import type { MetadataRoute } from "next"
import { publicLinks } from "@/data/public-profile"
import { locales, localePaths } from "@/i18n/locales"
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map(locale => [locale, publicLinks.portfolio + (localePaths[locale] || "/")]))
  return locales.map(locale => ({ url: languages[locale], alternates: { languages } }))
}
