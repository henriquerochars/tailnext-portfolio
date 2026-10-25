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
    icon: [
      { url: "/favicon.ico?v=hr-1", type: "image/x-icon", sizes: "16x16 32x32 48x48 64x64" },
      { url: "/favicon-hr.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
