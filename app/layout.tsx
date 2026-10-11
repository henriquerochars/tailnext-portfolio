import type { Metadata } from "next"
import { IBM_Plex_Mono, Manrope } from "next/font/google"

import Footer from "@/components/Footer"
import Providers from "./providers"
import "../styles/globals.css"
import { profileIntroduction, publicLinks } from "@/data/public-profile"

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" })
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" })

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
      <body className={`${manrope.variable} ${plexMono.variable}`}>
        <Providers>
          <a className="skip-link" href="#main-content">Skip to content</a>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
