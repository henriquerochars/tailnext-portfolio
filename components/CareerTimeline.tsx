import type { ReactNode } from "react"

export function CareerTimeline({ label, children, start = 1 }: { label: string; children: ReactNode; start?: number }) {
  return <ol aria-label={label} start={start} className="career-timeline">{children}</ol>
}

interface CareerTimelineItemProps {
  id: string
  title: string
  subtitle: string
  period: ReactNode
  children: ReactNode
}

export function CareerTimelineItem({ id, title, subtitle, period, children }: CareerTimelineItemProps) {
  return (
    <li id={id} className="career-entry">
      <p className="career-period">{period}</p>
      <div className="career-content">
        <h3>{title}</h3>
        <p className="career-organization">{subtitle}</p>
        <div className="career-description">{children}</div>
      </div>
    </li>
  )
}
