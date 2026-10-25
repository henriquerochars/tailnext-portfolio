export type SiteLocale = "pt-BR" | "en" | "es"
export const locales: readonly SiteLocale[] = ["en", "pt-BR", "es"]
export const localePaths: Record<SiteLocale, string> = { en: "", "pt-BR": "/pt-br", es: "/es" }
export function isLocale(value: unknown): value is SiteLocale {
  return typeof value === "string" && locales.includes(value as SiteLocale)
}
export function routeLocale(parts?: string[]): SiteLocale | undefined {
  if (!parts?.length) return "en"
  if (parts.length !== 1) return undefined
  return parts[0] === "pt-br" ? "pt-BR" : parts[0] === "es" ? "es" : undefined
}
