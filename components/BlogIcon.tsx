import Image from "next/image"

// Mirrors the blog's data/logo.svg (the italic "H" mark); adjacent text supplies the accessible name.
export default function BlogIcon({ className }: { className: string }) {
  return <Image src="/blog-logo.svg" alt="" aria-hidden="true" width={36} height={33} className={className} unoptimized />
}
