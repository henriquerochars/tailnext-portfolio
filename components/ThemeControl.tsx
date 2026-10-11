"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

const subscribeToMount = () => () => {}
const clientMounted = () => true
const serverMounted = () => false

export default function ThemeControl() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribeToMount, clientMounted, serverMounted)
  return (
    <select className="theme-control" aria-label="Theme" value={mounted ? theme : ""} disabled={!mounted}
      onChange={event => setTheme(event.target.value)}>
      <option value="" disabled>Theme</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  )
}
