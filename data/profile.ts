import { publicLinks } from "./public-profile"

export { profileIntroduction, publicLinks } from "./public-profile"

export type ContentSource =
  | { kind: "linkedin-inspection"; url: string; inspectedOn: string }
  | { kind: "owner-screenshot"; providedOn: string }

export const profileSource: ContentSource = {
  kind: "linkedin-inspection",
  url: publicLinks.linkedin,
  inspectedOn: "2026-10-11",
}

// All 59 LinkedIn source labels are retained. AWS/Amazon Web Services share one identity.
// Godot and GDScript are owner-added skills: they are not on LinkedIn, so they carry no source labels.
export const skills = {
  "harness-engineering": { label: "Harness Engineering", sourceLabels: ["Harness Engineering"] },
  "spec-driven-development": { label: "Spec-Driven Software Development", sourceLabels: ["Spec-Driven Software Development"] },
  ai: { label: "Artificial Intelligence (AI)", sourceLabels: ["Artificial Intelligence (AI)"] },
  react: { label: "React", sourceLabels: ["React.js"] },
  node: { label: "Node.js", sourceLabels: ["Node.js"] },
  next: { label: "Next.js", sourceLabels: ["Next.js"] },
  nest: { label: "NestJS", sourceLabels: ["NestJS"] },
  "react-native": { label: "React Native", sourceLabels: ["React Native"] },
  typescript: { label: "TypeScript", sourceLabels: ["TypeScript"] },
  javascript: { label: "JavaScript", sourceLabels: ["JavaScript"] },
  cloudformation: { label: "AWS CloudFormation", sourceLabels: ["AWS CloudFormation"] },
  ecs: { label: "Amazon ECS", sourceLabels: ["Amazon ECS"] },
  prisma: { label: "Prisma ORM", sourceLabels: ["Prisma ORM"] },
  "ai-agents": { label: "AI Agents", sourceLabels: ["AI Agents"] },
  mantine: { label: "Mantine UI", sourceLabels: ["Mantine UI"] },
  "github-actions": { label: "GitHub Actions", sourceLabels: ["GitHub Actions"] },
  "spring-boot": { label: "Spring Boot", sourceLabels: ["Spring Boot"] },
  java: { label: "Java", sourceLabels: ["Java"] },
  python: { label: "Python", sourceLabels: ["Python (Programming Language)"] },
  django: { label: "Django", sourceLabels: ["Django"] },
  spring: { label: "Spring Framework", sourceLabels: ["Spring Framework"] },
  "spring-mvc": { label: "Spring MVC", sourceLabels: ["Spring MVC"] },
  datadog: { label: "Datadog", sourceLabels: ["Datadog"] },
  "ci-cd": { label: "CI/CD", sourceLabels: ["Continuous Integration and Continuous Delivery (CI/CD)"] },
  "unit-testing": { label: "Unit Testing", sourceLabels: ["Unit Testing"] },
  aws: { label: "AWS", sourceLabels: ["AWS", "Amazon Web Services"] },
  ec2: { label: "Amazon EC2", sourceLabels: ["Amazon EC2"] },
  devops: { label: "DevOps", sourceLabels: ["DevOps"] },
  rds: { label: "Amazon Relational Database Service (RDS)", sourceLabels: ["Amazon Relational Database Service (RDS)"] },
  ux: { label: "UX", sourceLabels: ["UX"] },
  scrum: { label: "Scrum", sourceLabels: ["SCRUM"] },
  flutter: { label: "Flutter", sourceLabels: ["Flutter"] },
  mongodb: { label: "MongoDB", sourceLabels: ["MongoDB"] },
  postgresql: { label: "PostgreSQL", sourceLabels: ["PostgreSQL"] },
  sass: { label: "Sass", sourceLabels: ["SASS"] },
  rest: { label: "REST", sourceLabels: ["REST"] },
  css: { label: "CSS", sourceLabels: ["CSS"] },
  html: { label: "HTML5", sourceLabels: ["HTML5"] },
  git: { label: "Git", sourceLabels: ["Git"] },
  less: { label: "Less", sourceLabels: ["Less"] },
  vue: { label: "Vue.js", sourceLabels: ["Vue.js"] },
  jest: { label: "Jest", sourceLabels: ["Jest"] },
  graphql: { label: "GraphQL", sourceLabels: ["GraphQL"] },
  webpack: { label: "Webpack", sourceLabels: ["Webpack"] },
  vuetify: { label: "Vuetify", sourceLabels: ["Vuetify"] },
  vuex: { label: "Vuex", sourceLabels: ["Vuex"] },
  figma: { label: "Figma", sourceLabels: ["Figma"] },
  redux: { label: "Redux", sourceLabels: ["Redux"] },
  "git-flow": { label: "Git Flow", sourceLabels: ["Git Flow"] },
  "ant-design": { label: "Ant Design", sourceLabels: ["Ant Design"] },
  gatsby: { label: "Gatsby", sourceLabels: ["Gatsby"] },
  dart: { label: "Dart", sourceLabels: ["Dart"] },
  "api-development": { label: "API Development", sourceLabels: ["Desenvolvimento de API"] },
  express: { label: "Express.js", sourceLabels: ["Express.js"] },
  enzyme: { label: "Enzyme", sourceLabels: ["Enzyme"] },
  netilify: { label: "Netilify", sourceLabels: ["Netilify"] },
  pwa: { label: "PWA", sourceLabels: ["PWA"] },
  redis: { label: "Redis", sourceLabels: ["Redis"] },
  "game-development": { label: "Game Development", sourceLabels: ["Game Development"] },
  "game-design": { label: "Game Design", sourceLabels: ["Game Design"] },
  godot: { label: "Godot", sourceLabels: [] },
  gdscript: { label: "GDScript", sourceLabels: [] },
} as const

export type SkillId = keyof typeof skills

// Skills added by the owner outside LinkedIn. A LinkedIn refresh must keep them.
export const ownerAddedSkillIds: readonly SkillId[] = ["godot", "gdscript"]

export const topSkillIds: readonly SkillId[] = ["javascript", "react", "typescript", "react-native", "node"]

export const featuredSkillIds: readonly SkillId[] = [
  "typescript", "javascript", "react", "next", "react-native", "node", "nest",
  "python", "aws", "ai", "harness-engineering", "spec-driven-development",
  "godot", "gdscript",
]

// A missing list is not proof that an entry has no associated skills.
export type SkillAssociations =
  | { status: "verified"; skillIds: readonly SkillId[]; source: ContentSource }
  | { status: "verified-empty"; skillIds: readonly []; source: ContentSource; note: string }
  | { status: "pending"; skillIds: readonly SkillId[]; source: ContentSource; note: string }

export interface ProfileDate {
  year: number
  month?: number
}

export interface Employment {
  id: string
  employer: string
  role: string
  start: ProfileDate
  end: ProfileDate | null
  description: readonly string[]
  descriptionTechnologies: readonly string[]
  source: ContentSource
  skillAssociations: SkillAssociations
}

export interface Education {
  id: string
  institution: string
  program: string
  field: string
  start: ProfileDate
  end: ProfileDate
  status: "in-progress" | "completed"
  source: ContentSource
  skillAssociations: SkillAssociations
}

const experienceSource: ContentSource = { ...profileSource, url: `${publicLinks.linkedin}details/experience/` }
const educationSource: ContentSource = { ...profileSource, url: `${publicLinks.linkedin}details/education/` }

function verifiedSkills(entryId: string, type: "position" | "education", skillIds: readonly SkillId[]): SkillAssociations {
  return {
    status: "verified", skillIds,
    source: { ...profileSource, url: `${publicLinks.linkedin}overlay/${entryId}/skill-associations-details/?associationType=${type}` },
  }
}

export const employment: readonly Employment[] = [
  {
    id: "lena", employer: "Lena", role: "Senior Software Engineer",
    start: { year: 2025, month: 2 }, end: null,
    description: [
      "Build an AI-driven care coordination platform connecting AI agents with patients through phone calls and SMS, with call analytics reviewed by agents and care coordinators.",
      "Develop with Next.js, TypeScript, Prisma, Python and AWS, and use harness engineering, specifications, guardrails and automated validation to guide AI coding agents.",
    ],
    descriptionTechnologies: ["Next.js", "Next Server Actions", "TypeScript", "Prisma", "Python", "AWS"],
    source: experienceSource,
    skillAssociations: verifiedSkills("2642341567", "position", ["python", "aws", "harness-engineering", "prisma", "cloudformation", "mantine", "rds", "typescript", "ai", "postgresql", "ecs", "ai-agents", "next", "github-actions", "spec-driven-development"]),
  },
  {
    id: "ish", employer: "ISH Tecnologia", role: "Senior Software Engineer",
    start: { year: 2023, month: 8 }, end: { year: 2025, month: 2 },
    description: [
      "Developed cybersecurity incident and vulnerability management systems, including APIs, permissions, dashboards and report generation across TypeScript, Python and Java services.",
      "Helped migrate a Django API to NestJS, optimize PostgreSQL queries and mentor teammates, with automated testing and GitHub Actions CI/CD.",
    ],
    descriptionTechnologies: ["JavaScript", "TypeScript", "Python", "Java", "Next.js", "NestJS", "Django", "Spring Boot", "Ant Design", "Robot Framework", "Jest", "GitHub Actions", "PostgreSQL", "WebSocket", "Jasper", "ApexCharts"],
    source: experienceSource,
    skillAssociations: verifiedSkills("2232110735", "position", ["python", "node", "javascript", "spring-boot", "react", "django", "nest", "java", "typescript", "postgresql", "jest", "next", "devops", "unit-testing", "ci-cd"]),
  },
  {
    id: "lendingclub", employer: "LendingClub", role: "Senior Software Engineer",
    start: { year: 2022, month: 7 }, end: { year: 2023, month: 7 },
    description: ["Built features for LendingClub's new internet banking experience with React and TypeScript, contributing from user-experience planning through development using internal UI components and Django server-side rendering."],
    descriptionTechnologies: ["TypeScript", "JavaScript", "React", "Redux", "Sass", "Jest", "Enzyme", "Storybook", "Django"],
    source: experienceSource,
    skillAssociations: verifiedSkills("2116874334", "position", ["python", "javascript", "react", "django", "typescript", "graphql", "unit-testing"]),
  },
  {
    id: "questrade", employer: "Questrade Financial Group", role: "Senior Software Engineer",
    start: { year: 2022, month: 3 }, end: { year: 2022, month: 7 },
    description: ["Developed a stock-trading mobile application with React Native, TypeScript and MobX. Helped document projects and support the transition of developers from Vizir following its acquisition by Questrade."],
    descriptionTechnologies: ["React Native", "TypeScript", "MobX"],
    source: experienceSource,
    skillAssociations: verifiedSkills("1925964948", "position", ["javascript", "react", "typescript", "datadog", "react-native", "unit-testing"]),
  },
  {
    id: "vizir", employer: "Vizir Software Studio", role: "Software Developer",
    start: { year: 2021, month: 4 }, end: { year: 2022, month: 3 },
    description: ["Worked across web, mobile and backend development for Vizir Bank and Natura Pay. Used micro frontends and Webpack Module Federation to share dependencies between banking applications."],
    descriptionTechnologies: ["React", "React Native", "Node.js", "TypeScript", "Redux", "MobX", "Jest", "Enzyme", "Webpack Module Federation"],
    source: experienceSource,
    skillAssociations: verifiedSkills("1764944168", "position", ["node", "javascript", "react", "typescript", "react-native", "unit-testing", "ci-cd"]),
  },
  {
    id: "will-bank", employer: "will bank", role: "Software Developer",
    start: { year: 2019, month: 12 }, end: { year: 2021, month: 4 },
    description: ["Built internal customer-service systems with React, TypeScript, Node.js and NestJS, collaborating with service attendants on feature design. Also contributed Flutter mobile features and migrated backend services from Node.js to NestJS."],
    descriptionTechnologies: ["React", "Node.js", "NestJS", "Redux", "Ant Design", "TypeScript", "Less", "Jest", "Enzyme", "Storybook", "Dart", "Flutter"],
    source: experienceSource,
    skillAssociations: verifiedSkills("1671787967", "position", ["node", "javascript", "flutter", "aws", "spring-mvc", "spring-boot", "react", "nest", "java", "typescript", "unit-testing"]),
  },
  {
    id: "inflor", employer: "INFLOR", role: "Software Developer",
    start: { year: 2019, month: 8 }, end: { year: 2019, month: 11 },
    description: ["Developed responsive web systems for forest and agricultural management with Vue.js, Vue Router, Vuex, Vuetify and Sass."],
    descriptionTechnologies: ["Vue.js", "Vue Router", "Vuex", "Vuetify", "Sass"],
    source: experienceSource,
    skillAssociations: verifiedSkills("1505162474", "position", ["javascript", "vuex", "vue", "vuetify"]),
  },
  {
    id: "techpark", employer: "Techpark - Tecnologia & Mobilidade", role: "Software Developer",
    start: { year: 2018, month: 7 }, end: { year: 2019, month: 8 },
    description: ["Developed Node.js APIs, microservices and MongoDB/PostgreSQL databases on AWS for a driving-school platform. Built a Flutter application for students to manage theoretical and practical classes."],
    descriptionTechnologies: ["Node.js", "MongoDB", "PostgreSQL", "AWS", "Flutter"],
    source: experienceSource,
    skillAssociations: verifiedSkills("1357154726", "position", ["node", "javascript", "flutter", "aws", "react", "rds", "mongodb", "express", "postgresql", "ec2"]),
  },
  {
    id: "banestes", employer: "Banestes S/A – Banco do Estado do Espírito Santo", role: "Technical Support",
    start: { year: 2017, month: 10 }, end: { year: 2018, month: 7 },
    description: ["Supported Internet Banking web/app services and Office Banking, using SQL, PowerShell and Python scripts to automate support work."],
    descriptionTechnologies: ["SQL", "PowerShell", "Python"],
    source: experienceSource,
    skillAssociations: { status: "verified-empty", skillIds: [], source: experienceSource, note: "No association list on the complete experience entry; no Banestes associations in the fully loaded global skills view. Description technologies are retained separately." },
  },
]

export const education: readonly Education[] = [
  {
    id: "cruzeiro-do-sul", institution: "Universidade Cruzeiro do Sul", program: "Postgraduate", field: "Game Design",
    start: { year: 2026, month: 10 }, end: { year: 2027, month: 8 }, status: "in-progress",
    source: { kind: "owner-screenshot", providedOn: "2026-10-28" },
    skillAssociations: { status: "verified", skillIds: ["game-development", "game-design"], source: { kind: "owner-screenshot", providedOn: "2026-10-28" } },
  },
  {
    id: "unipds", institution: "UNIPDS",
    program: "Postgraduate Program in Software Engineering for Applied AI", field: "Computer Science",
    start: { year: 2026, month: 9 }, end: { year: 2027, month: 9 }, status: "in-progress",
    source: educationSource,
    skillAssociations: verifiedSkills("1265204527", "education", ["ai", "spec-driven-development", "harness-engineering"]),
  },
  {
    id: "estacio", institution: "Estácio", program: "Bachelor's degree", field: "Computer Science",
    start: { year: 2018 }, end: { year: 2022 }, status: "completed",
    source: educationSource,
    skillAssociations: { status: "verified-empty", skillIds: [], source: educationSource, note: "No association list on the complete education entry; no Estácio associations in the fully loaded global skills view." },
  },
]

export const globalSkillsSource: ContentSource = { ...profileSource, url: `${publicLinks.linkedin}details/skills/` }
