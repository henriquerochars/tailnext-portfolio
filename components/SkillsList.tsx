import { skills, type SkillId } from "@/data/profile"

interface SkillsListProps {
  skillIds: readonly SkillId[]
  label: string
  centeredOnMobile?: boolean
}

export default function SkillsList({ skillIds, label, centeredOnMobile = false }: SkillsListProps) {
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-2 ${centeredOnMobile ? "justify-center md:justify-start" : "justify-start"}`}>
      {skillIds.map(id => (
        <li key={id} className="max-w-full break-words rounded bg-gray-200 px-4 py-2 font-semibold text-stone-900 dark:bg-stone-700 dark:text-stone-100">
          {skills[id].label}
        </li>
      ))}
    </ul>
  )
}
