import { notFound, redirect } from "next/navigation"
import AboutSection from "@/components/AboutSection"
import HeroSection from "@/components/HeroSection"
import ExperienceSection from "@/components/ExperienceSection"
import EducationSection from "@/components/EducationSection"
import BlogSection from "@/components/BlogSection"
import { getMessages } from "@/i18n/messages"
import { routeLocale } from "@/i18n/locales"

export function generateStaticParams() {
  return [{ locale: [] }, { locale: ["pt-br"] }, { locale: ["es"] }, { locale: ["en"] }]
}
export default async function Home({ params }: { params: Promise<{ locale?: string[] }> }) {
  const { locale: parts } = await params
  if (parts?.length === 1 && parts[0] === "en") redirect("/")
  const locale = routeLocale(parts)
  if (!locale) notFound()
  const messages = getMessages(locale)
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 md:max-w-5xl">
      <HeroSection messages={messages} />
      <AboutSection messages={messages} />
      <ExperienceSection messages={messages} locale={locale} />
      <EducationSection messages={messages} locale={locale} />
      <BlogSection key={locale} ui={messages.ui} locale={locale} />
    </main>
  )
}
