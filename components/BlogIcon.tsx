import Image from "next/image"

// Reuses the blog's data/logo.svg; adjacent text supplies the accessible name.
export default function BlogIcon({ className }: { className: string }) {
  return <Image src="/blog-logo.svg" alt="" aria-hidden="true" width={36} height={30} className={className} unoptimized />
}
