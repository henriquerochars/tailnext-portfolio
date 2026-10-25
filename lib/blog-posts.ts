import type { SiteLocale } from "@/i18n/locales"
import { publicLinks } from "@/data/public-profile"

export type BlogPost = {
  title: string
  url: string
  date: string
  summary: string
  locale: SiteLocale
}

/** Read the blog's public Contentlayer search index, never its authored MDX. */
export function latestBlogPosts(value: unknown, locale: SiteLocale = "pt-BR"): BlogPost[] {
  if (!Array.isArray(value)) throw new Error("Invalid blog index")

  const prefix = locale === "pt-BR" ? "blog/" : `${locale}/blog/`
  const posts: BlogPost[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || entry.draft === true) continue
    if (typeof entry.title !== "string" || !entry.title.trim()
      || typeof entry.date !== "string" || !Number.isFinite(Date.parse(entry.date))
      || typeof entry.path !== "string" || !entry.path.startsWith(prefix) || !/^(?:(?:en|es)\/)?blog\/[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*$/u.test(entry.path)
      || (locale !== "pt-BR" && entry.locale === undefined)
      || (entry.locale !== undefined && entry.locale !== locale && entry.locale !== "pt-BR")) continue

    posts.push({
      locale: entry.locale === "pt-BR" ? "pt-BR" : locale,
      title: entry.title.trim(),
      url: new URL(entry.path, `${publicLinks.blog}/`).href,
      date: new Date(entry.date).toISOString(),
      summary: typeof entry.summary === "string" ? entry.summary.trim() : "",
    })
  }

  const seen = new Set<string>()
  return posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.url.localeCompare(b.url))
    .filter(post => {
      if (seen.has(post.url)) return false
      seen.add(post.url)
      return true
    }).slice(0, 5)
}
