// Add published releases here, with ISO dates and descriptive alt text for each GIF.
export type PawsphemyRelease = {
  name: string
  date: string // YYYY-MM-DD
  explanation: string
  gifs: { src: string; alt: string }[]
}

export const pawsphemyReleases: PawsphemyRelease[] = []
