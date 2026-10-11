import Image from "next/image"
import { HiArrowDown } from "react-icons/hi"
import { AiOutlineGithub, AiOutlineLinkedin, AiOutlineTwitter } from "react-icons/ai"
import { profileIntroduction, publicLinks } from "@/data/public-profile"

export default function HeroSection() {
  return (
    <div className="profile-introduction">
      <Image src="/perfil.jpeg" alt="Henrique Rocha" width={96} height={96} className="portrait" preload />
      <p className="eyebrow">{profileIntroduction.greeting}</p>
      <h1><a href="#home" aria-label={`Home — ${profileIntroduction.name}`}>{profileIntroduction.name}</a></h1>
      <p className="professional-title">I&#39;m a {profileIntroduction.role} at {profileIntroduction.employer}</p>
      <p className="profile-location">Based in {profileIntroduction.location}.</p>
      <p className="positioning">{profileIntroduction.hero}</p>
      <a className="about-shortcut" href="#about" aria-label="Scroll to About section">
        Get to know me <HiArrowDown size={16} aria-hidden="true" />
      </a>
      <ul className="social-links" aria-label="Social links">
        <li><a href={publicLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><AiOutlineGithub size={24} aria-hidden="true" /></a></li>
        <li><a href={publicLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><AiOutlineLinkedin size={24} aria-hidden="true" /></a></li>
        <li><a href={publicLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"><AiOutlineTwitter size={24} aria-hidden="true" /></a></li>
      </ul>
    </div>
  )
}
