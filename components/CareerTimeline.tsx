import type { ReactNode } from "react"

export function CareerTimeline({ label, children }: { label: string; children: ReactNode }) {
  return <ol aria-label={label} className="mt-10 border-l-2 border-stone-200 dark:border-stone-700">{children}</ol>
}

interface CareerTimelineItemProps {
  id: string
  title: string
  subtitle: string
  period: ReactNode
  duration?: ReactNode
  children: ReactNode
}

export function CareerTimelineItem({ id, title, subtitle, period, duration, children }: CareerTimelineItemProps) {
  return (
    <li id={id} className="relative min-w-0 pb-12 pl-6 last:pb-0 md:grid md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6 md:pl-8">
      <span aria-hidden="true" className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-teal-600" />
      <p className="mb-3 text-sm leading-6 text-stone-600 dark:text-stone-300 md:mb-0">
        {period}
        {duration ? <span className="block font-semibold text-stone-800 dark:text-stone-100">{duration}</span> : null}
      </p>
      <div className="min-w-0 break-words">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-1 font-semibold text-stone-600 dark:text-stone-300">{subtitle}</p>
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </li>
  )
}
