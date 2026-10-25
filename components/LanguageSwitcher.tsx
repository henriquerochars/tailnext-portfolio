'use client'

import styles from './LanguageSwitcher.module.css'

export type SiteLocale = 'pt-BR' | 'en' | 'es'

type Props = {
  locale: SiteLocale
  label: string
  onLocaleChange: (locale: SiteLocale) => void
}

export default function LanguageSwitcher({ locale, label, onLocaleChange }: Props) {
  return (
    <span className={styles.root} data-language-switcher="">
      <svg
        className={styles.globe}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18M5 6h14M5 18h14" />
      </svg>
      <select
        className={styles.select}
        name="language"
        aria-label={label}
        value={locale}
        onChange={(event) => {
          const value = event.currentTarget.value
          if (value === 'pt-BR' || value === 'en' || value === 'es') onLocaleChange(value)
        }}
      >
        <option value="pt-BR">Português (BR)</option>
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
      <svg
        className={styles.chevron}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </span>
  )
}
