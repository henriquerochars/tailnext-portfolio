import type { Metadata } from "next"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import Providers from "./providers"
import "../styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://henriquerochadev.vercel.app"),
  title: "Henrique Rocha Dev",
  description: "Personal portfolio of Henrique Rocha Serrano, Software Engineer.",
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
