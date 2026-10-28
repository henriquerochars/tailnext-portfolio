import { createRoot } from "react-dom/client"
import PawsphemySection from "../../../components/PawsphemySection"

const releases = Array.from({ length: 12 }, (_, index) => ({
  name: `Release ${index + 1}`,
  date: `2025-01-${String(index + 1).padStart(2, "0")}`,
  explanation: `Full explanation ${index + 1}`,
  gifs: [{ src: `/fixture-${index + 1}.gif`, alt: `Example ${index + 1}` }],
}))
createRoot(document.getElementById("root")!).render(<PawsphemySection locale="en" releases={releases} />)
