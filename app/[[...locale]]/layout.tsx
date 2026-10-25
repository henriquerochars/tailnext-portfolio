import type { Metadata } from "next"
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import Providers from "../providers"
import "../../styles/globals.css"
import { publicLinks } from "@/data/public-profile"
import { getMessages } from "@/i18n/messages"
import { localePaths, routeLocale } from "@/i18n/locales"

type Props = { children: React.ReactNode; params: Promise<{ locale?: string[] }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = routeLocale((await params).locale) ?? "en"
  const messages = getMessages(locale)
  const description = messages.introduction.metadataDescription
  const title = `${messages.ui.portfolio} | HenriqueRochaDev`
  const canonical = `${publicLinks.portfolio}${localePaths[locale] || "/"}`
  return {
    metadataBase: new URL(publicLinks.portfolio), title, description,
    alternates: { canonical, languages: { en: `${publicLinks.portfolio}/`, "pt-BR": `${publicLinks.portfolio}/pt-br`, es: `${publicLinks.portfolio}/es`, "x-default": `${publicLinks.portfolio}/` } },
    openGraph: { title, description, url: canonical, locale: locale === "pt-BR" ? "pt_BR" : locale === "es" ? "es_ES" : "en_US", alternateLocale: ["en_US", "pt_BR", "es_ES"].filter(value => value !== (locale === "pt-BR" ? "pt_BR" : locale === "es" ? "es_ES" : "en_US")), type: "website" },
    icons: { icon: [{ url: "/favicon.ico?v=h-3", type: "image/x-icon", sizes: "16x16 32x32 48x48 64x64" }, { url: "/favicon-hr.png?v=h-3", type: "image/png", sizes: "96x96" }], apple: [{ url: "/apple-touch-icon.png?v=h-3", sizes: "180x180", type: "image/png" }] },
  }
}
export default async function RootLayout({ children, params }: Props) {
  const locale = routeLocale((await params).locale) ?? "en"
  return <html lang={locale} suppressHydrationWarning><body className="dark:bg-stone-900"><Providers><Navbar locale={locale} ui={getMessages(locale).ui} />{children}<Footer /></Providers></body></html>
}
