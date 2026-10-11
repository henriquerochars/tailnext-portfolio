import type { Metadata } from "next"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import Providers from "./providers"
import "../styles/globals.css"
import { profileIntroduction, publicLinks } from "@/data/public-profile"

export const metadata: Metadata = {
  metadataBase: new URL(publicLinks.portfolio),
  title: "Henrique Rocha Dev",
  description: profileIntroduction.metadataDescription,
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark:bg-stone-900">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
