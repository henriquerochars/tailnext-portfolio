import { profileIntroduction } from "@/data/public-profile"

export default function Footer() {
  return <footer className="site-footer">© {new Date().getFullYear()} {profileIntroduction.name}</footer>
}
