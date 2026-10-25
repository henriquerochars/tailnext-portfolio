import { publicLinks } from "@/data/public-profile"

export type BlogPost = {
  title: string
  url: string
  date: string
  summary: string
}

/** Read the blog's public Contentlayer search index, never its authored MDX. */
export function latestBlogPosts(value: unknown): BlogPost[] {
  if (!Array.isArray(value)) throw new Error("Invalid blog index")

  const posts: BlogPost[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || entry.draft === true) continue
    if (typeof entry.title !== "string" || !entry.title.trim()
      || typeof entry.date !== "string" || !Number.isFinite(Date.parse(entry.date))
      || typeof entry.path !== "string" || !/^blog\/[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*$/u.test(entry.path)) continue

    posts.push({
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
