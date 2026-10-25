"use client"

import { useEffect, useState } from "react"
import { publicLinks } from "@/data/public-profile"
import type { BlogPost } from "@/lib/blog-posts"

type FeedState = { status: "loading" | "error" } | { status: "ready"; posts: BlogPost[] }
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
})

export default function BlogSection() {
  const [feed, setFeed] = useState<FeedState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function loadPosts() {
      try {
        const response = await fetch("/api/blog-posts", { signal: controller.signal })
        if (!response.ok) throw new Error("Blog unavailable")
        const data: { posts: BlogPost[] } = await response.json()
        if (!Array.isArray(data.posts)) throw new Error("Invalid blog response")
        if (!controller.signal.aborted) setFeed({ status: "ready", posts: data.posts })
      } catch {
        if (!controller.signal.aborted) setFeed({ status: "error" })
      }
    }
    void loadPosts()
    return () => controller.abort()
  }, [attempt])

  return (
    <section id="blog" aria-labelledby="blog-heading" className="py-12 md:py-16">
      <h2 id="blog-heading" className="text-center text-4xl font-bold">Latest blog posts</h2>
      <hr className="mx-auto my-4 h-1 w-6 rounded border-0 bg-teal-500" />
      <p className="mb-8 text-center text-neutral-600 dark:text-neutral-300">
        Notes on software development and what I learn along the way. Written in Portuguese.
      </p>
      <div aria-live="polite" aria-busy={feed.status === "loading"}>
        {feed.status === "loading" && <p className="py-6 text-center">Loading recent posts…</p>}
        {feed.status === "error" && (
          <div className="rounded-xl border border-neutral-200 p-6 text-center dark:border-stone-700">
            <p>Recent posts are temporarily unavailable. You can still read them on the blog.</p>
            <button type="button" className="mt-4 min-h-11 rounded-md px-4 font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-400"
              onClick={() => { setFeed({ status: "loading" }); setAttempt(value => value + 1) }}>
              Try again
            </button>
          </div>
        )}
        {feed.status === "ready" && (feed.posts.length ? (
          <ol aria-label="Latest blog posts" lang="pt-BR" className="space-y-4">
            {feed.posts.map(post => (
              <li key={post.url}>
                <article className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8 dark:border-stone-700 dark:bg-stone-800/50">
                  <time dateTime={post.date} className="text-sm text-neutral-600 dark:text-neutral-300">
                    {dateFormat.format(new Date(post.date))}
                  </time>
                  <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="break-words text-teal-700 underline-offset-4 hover:underline dark:text-teal-400">
                      {post.title}<span className="sr-only"> (abre em uma nova aba)</span>
                    </a>
                  </h3>
                  {post.summary && <p className="mt-3 break-words leading-relaxed text-neutral-700 dark:text-neutral-200">{post.summary}</p>}
                </article>
              </li>
            ))}
          </ol>
        ) : <p className="py-6 text-center">No published posts yet. Check back soon.</p>)}
      </div>
      <div className="mt-8 text-center">
        <a href={publicLinks.blog} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-md px-4 font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-400">
          Read all posts <span aria-hidden="true" className="ml-2">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </section>
  )
}
