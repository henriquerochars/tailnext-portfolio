import { blogPostsResponse } from "@/lib/blog-feed"
import { isLocale } from "@/i18n/locales"
export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale") ?? "pt-BR"
  if (!isLocale(locale)) return Response.json({ error: "Unsupported locale" }, { status: 400 })
  return blogPostsResponse(fetch, locale)
}
