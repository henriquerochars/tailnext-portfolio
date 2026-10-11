import { expect, test } from "@playwright/test"
import {
  education, employment, featuredSkillIds, globalSkillsSource, profileSource,
  skills, topSkillIds, type ProfileDate,
} from "../../data/profile"

function dateValue(date: ProfileDate): number {
  expect(Number.isInteger(date.year)).toBe(true)
  expect(date.year).toBeGreaterThan(1900)
  if (date.month !== undefined) {
    expect(Number.isInteger(date.month)).toBe(true)
    expect(date.month).toBeGreaterThanOrEqual(1)
    expect(date.month).toBeLessThanOrEqual(12)
  }
  return date.year * 12 + (date.month ?? 1)
}

test("keeps the complete reviewed career with precise dates and expected postgraduate completion", () => {
  expect(employment.map(entry => entry.id)).toEqual([
    "lena", "ish", "lendingclub", "questrade", "vizir", "will-bank", "inflor", "techpark", "banestes",
  ])
  expect(education.map(entry => entry.id)).toEqual(["unipds", "estacio"])
  expect(new Set([...employment, ...education].map(entry => entry.id)).size).toBe(employment.length + education.length)
  expect(employment.filter(entry => entry.end === null).map(entry => entry.id)).toEqual(["lena"])
  for (const [index, entry] of employment.entries()) {
    expect(entry.start.month).toBeDefined()
    const start = dateValue(entry.start)
    if (entry.end) {
      expect(entry.end.month).toBeDefined()
      expect(dateValue(entry.end)).toBeGreaterThanOrEqual(start)
    }
    if (index > 0) expect(start).toBeLessThanOrEqual(dateValue(employment[index - 1].start))
    expect(entry.description.length).toBeGreaterThan(0)
  }
  for (const entry of education) expect(dateValue(entry.end)).toBeGreaterThanOrEqual(dateValue(entry.start))
  expect(education[0]).toMatchObject({ status: "in-progress", start: {year: 2026, month: 9}, end: {year: 2027, month: 9} })
  expect(education[1]).toMatchObject({ status: "completed", start: {year: 2018}, end: {year: 2022} })
  expect(education[1].start.month).toBeUndefined()
  expect(education[1].end.month).toBeUndefined()
  expect(employment[8].role).toBe("Technical Support")
})

test("retains source labels and verifies every skill relationship without inference", () => {
  const catalog = new Set(Object.keys(skills))
  const labels = Object.values(skills).flatMap(skill => [...skill.sourceLabels])
  expect(labels).toHaveLength(59)
  expect(new Set(labels.map(label => label.toLowerCase())).size).toBe(labels.length)
  expect(new Set(Object.values(skills).map(skill => skill.label.toLowerCase())).size).toBe(catalog.size)
  expect(skills.aws.sourceLabels).toEqual(["AWS", "Amazon Web Services"])
  const expectedAssociationCounts = [15, 15, 7, 6, 7, 11, 4, 10, 0, 3, 0]
  for (const [index, entry] of [...employment, ...education].entries()) {
    const associations = entry.skillAssociations
    expect(associations.status).not.toBe("pending")
    expect(associations.skillIds).toHaveLength(expectedAssociationCounts[index])
    expect(new Set(associations.skillIds).size).toBe(associations.skillIds.length)
    for (const id of associations.skillIds) expect(catalog.has(id)).toBe(true)
    for (const source of [entry.source, associations.source]) {
      expect(new URL(source.url).origin).toBe("https://www.linkedin.com")
      expect(source.inspectedOn).toBe(profileSource.inspectedOn)
    }
    if (associations.status === "verified-empty") {
      expect(associations.skillIds).toEqual([])
      expect(associations.note).toContain("No association list")
    } else if (associations.status === "verified") {
      expect(associations.skillIds.length).toBeGreaterThan(0)
      expect(associations.source.url).toContain("skill-associations-details/")
      expect(associations.source.url).toContain(`associationType=${"employer" in entry ? "position" : "education"}`)
    }
  }
  expect(globalSkillsSource.url).toMatch(/\/details\/skills\/$/)
  // A described technology and an associated skill are different evidence.
  expect(employment[8].descriptionTechnologies).toContain("Python")
  expect(employment[8].skillAssociations.skillIds).toEqual([])
  expect(employment[2].skillAssociations.skillIds).toContain("graphql")
  expect(employment[2].descriptionTechnologies).not.toContain("GraphQL")
})

test("curates at most twelve verified skills while preserving the full catalog and top skills", () => {
  expect(featuredSkillIds.length).toBeGreaterThan(0)
  expect(featuredSkillIds.length).toBeLessThanOrEqual(12)
  expect(new Set(featuredSkillIds).size).toBe(featuredSkillIds.length)
  const associated = new Set([...employment, ...education].flatMap(entry => [...entry.skillAssociations.skillIds]))
  for (const id of [...featuredSkillIds, ...topSkillIds]) {
    expect(skills[id]).toBeDefined()
    expect(associated.has(id)).toBe(true)
  }
  expect(Object.keys(skills).length).toBeGreaterThan(featuredSkillIds.length)
  expect(topSkillIds).toEqual(["javascript", "react", "typescript", "react-native", "node"])
})
