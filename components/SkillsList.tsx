import { skills, type SkillId } from "@/data/profile"

interface SkillsListProps {
  skillIds: readonly SkillId[]
  label: string
}

export default function SkillsList({ skillIds, label }: SkillsListProps) {
  return (
    <ul aria-label={label} className="skills-list">
      {skillIds.map(id => (
        <li key={id}>
          {skills[id].label}
        </li>
      ))}
    </ul>
  )
}
