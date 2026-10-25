import { blogPostsResponse } from "@/lib/blog-feed"

export async function GET() {
  return blogPostsResponse()
}
