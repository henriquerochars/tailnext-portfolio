"use client"

import { useEffect, useState } from "react"
import { publicLinks } from "@/data/public-profile"
import type { BlogPost } from "@/lib/blog-posts"
import type { SiteLocale } from "@/i18n/locales"
import type { UIStrings } from "@/i18n/ui"
import BlogIcon from "./BlogIcon"

type FeedState = { status: "loading" | "error" } | { status: "ready"; posts: BlogPost[]; sourceLocale: SiteLocale }


export default function BlogSection({ locale, ui }: { locale: SiteLocale; ui: UIStrings }) {
  const blogHref = publicLinks.blog + (locale === "pt-BR" ? "" : `/${locale}`)
  const [feed, setFeed] = useState<FeedState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function loadPosts() {
      try {
        const response = await fetch(`/api/blog-posts?locale=${locale}`, { signal: controller.signal })
        if (!response.ok) throw new Error("Blog unavailable")
        const data: { posts: BlogPost[]; sourceLocale?: SiteLocale } = await response.json()
        if (!Array.isArray(data.posts)) throw new Error("Invalid blog response")
        if (!controller.signal.aborted) setFeed({ status: "ready", posts: data.posts, sourceLocale: data.sourceLocale ?? "pt-BR" })
      } catch {
        if (!controller.signal.aborted) setFeed({ status: "error" })
      }
    }
    void loadPosts()
    return () => controller.abort()
  }, [attempt, locale])

  return (
    <section id="blog" aria-labelledby="blog-heading" className="py-12 md:py-16">
      <h2 id="blog-heading" className="flex items-center justify-center gap-2 text-center text-3xl font-bold sm:gap-3 sm:text-4xl">
        <BlogIcon className="h-6 w-8 shrink-0 sm:h-8 sm:w-10" />
        <span>{ui.latest}</span>
      </h2>
      <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
      <p className="mb-8 text-center text-neutral-600 dark:text-neutral-300">
        {ui.blogDescription}
      </p>
      {feed.status === "ready" && feed.sourceLocale !== locale && <p className="mb-4 text-center text-sm">{ui.portugueseSource}</p>}
      <div aria-live="polite" aria-busy={feed.status === "loading"}>
        {feed.status === "loading" && <p className="py-6 text-center">{ui.loading}</p>}
        {feed.status === "error" && (
          <div className="rounded-xl border border-neutral-200 p-6 text-center dark:border-stone-700">
            <p>{ui.feedError}</p>
            <button type="button" className="mt-4 min-h-11 rounded-md px-4 font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-400"
              onClick={() => { setFeed({ status: "loading" }); setAttempt(value => value + 1) }}>
              {ui.retry}
            </button>
          </div>
        )}
        {feed.status === "ready" && (feed.posts.length ? (
          <ol aria-label={ui.latest} lang={feed.sourceLocale} className="space-y-4">
            {feed.posts.map(post => (
              <li key={post.url}>
                <article lang={post.locale ?? feed.sourceLocale} className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8 dark:border-stone-700 dark:bg-stone-800/50">
                  {post.locale === "pt-BR" && locale !== "pt-BR" && feed.sourceLocale === locale && <p lang={locale} className="mb-3 text-sm">{ui.portugueseSource}</p>}
                  <time lang={locale} dateTime={post.date} className="text-sm text-neutral-600 dark:text-neutral-300">
                    {new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(post.date))}
                  </time>
                  <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="break-words text-teal-700 underline-offset-4 hover:underline dark:text-teal-400">
                      {post.title}<span lang={locale} className="sr-only"> ({ui.newTab})</span>
                    </a>
                  </h3>
                  {post.summary && <p className="mt-3 break-words leading-relaxed text-neutral-700 dark:text-neutral-200">{post.summary}</p>}
                </article>
              </li>
            ))}
          </ol>
        ) : <p className="py-6 text-center">{ui.empty}</p>)}
      </div>
      <div className="mt-8 text-center">
        <a href={blogHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-md px-4 font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-400">
          {ui.readAll} <span aria-hidden="true" className="ml-2">↗</span>
          <span lang={locale} className="sr-only"> ({ui.newTab})</span>
        </a>
      </div>
    </section>
  )
}
