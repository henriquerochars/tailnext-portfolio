import { publicLinks } from "@/data/public-profile"
import { type SiteLocale } from "@/i18n/locales"
import { latestBlogPosts } from "./blog-posts"

export async function blogPostsResponse(fetcher: typeof fetch = fetch, locale: SiteLocale = "pt-BR"): Promise<Response> {
  async function load(path: string, sourceLocale: SiteLocale) {
    const response = await fetcher(`${publicLinks.blog}/${path}`, {
      cache: "no-store", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" }, redirect: "error",
    })
    if (!response.ok) throw new Error("Blog index unavailable")
    return { posts: latestBlogPosts(await response.json(), sourceLocale), sourceLocale }
  }
  try {
    let result
    try { result = await load(`search.${locale}.json`, locale) }
    catch { result = await load("search.json", "pt-BR") }
    return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } })
  } catch {
    return Response.json({ error: "Blog posts are temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}
