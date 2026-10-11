import AboutSection from "@/components/AboutSection"
import HeroSection from "@/components/HeroSection"
import ExperienceSection from "@/components/ExperienceSection"
import EducationSection from "@/components/EducationSection"
import PortfolioLayout from "@/components/PortfolioLayout"

export default function Home() {
  return (
    <PortfolioLayout profile={<HeroSection />}>
      <AboutSection />
      <ExperienceSection />
      <EducationSection />
    </PortfolioLayout>
  )
}
