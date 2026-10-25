import Image from "next/image"

// The blog's identity: the italic H mark on a black tile (blog data/logo.svg); adjacent text supplies the accessible name.
export default function BlogIcon({ className }: { className: string }) {
  return <Image src="/blog-logo.svg" alt="" aria-hidden="true" width={32} height={32} className={className} unoptimized />
}
