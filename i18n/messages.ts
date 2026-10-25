// Versioned editorial translations. Career facts and source evidence remain in data/profile.ts.
import { employment, education, skills, type SkillId } from "@/data/profile"
import { profileIntroduction } from "@/data/public-profile"
import { englishUI, portugueseUI, spanishUI } from "./ui"
import type { SiteLocale } from "./locales"

type Introduction = { [K in keyof typeof profileIntroduction]: K extends "about" ? readonly string[] : string }
type JobTranslation = { role: string; description: readonly string[] }
type StudyTranslation = { program: string; field: string }

const introductions: Record<"pt-BR" | "es", Introduction> = {
  "pt-BR": {
    name: profileIntroduction.name, greeting: "Olá, eu sou o Henrique!", role: "Engenheiro de Software Sênior", employer: "Lena", location: "Rio de Janeiro, Brasil",
    hero: "Desenvolvo produtos full-stack e mobile, com foco atual em soluções baseadas em IA.",
    about: [
      "Desenvolvo produtos web e mobile com JavaScript e TypeScript, trabalhando com React, Next.js, React Native, Node.js e NestJS. Minha experiência abrange serviços financeiros, cibersegurança e saúde.",
      "Na Lena, ajudo a construir uma plataforma de coordenação de cuidados baseada em IA que conecta agentes de IA a pacientes por chamadas telefônicas e SMS. Também trabalho com engenharia de harness e desenvolvimento orientado por especificações, usando especificações, diretrizes de segurança e validação automatizada para orientar agentes de programação com IA.",
      "Atualmente, curso uma pós-graduação em Engenharia de Software para IA Aplicada na UNIPDS.",
    ],
    metadataDescription: "Henrique Rocha Serrano, Engenheiro de Software Sênior na Lena, no Rio de Janeiro. Desenvolvimento full-stack e mobile, soluções baseadas em IA e engenharia de harness.",
  },
  es: {
    name: profileIntroduction.name, greeting: "¡Hola, soy Henrique!", role: "Ingeniero de Software Sénior", employer: "Lena", location: "Río de Janeiro, Brasil",
    hero: "Desarrollo productos full-stack y móviles, con un enfoque actual en soluciones basadas en IA.",
    about: [
      "Desarrollo productos web y móviles con JavaScript y TypeScript, trabajando con React, Next.js, React Native, Node.js y NestJS. Mi experiencia abarca servicios financieros, ciberseguridad y salud.",
      "En Lena, ayudo a construir una plataforma de coordinación de cuidados basada en IA que conecta agentes de IA con pacientes mediante llamadas telefónicas y SMS. También trabajo con ingeniería de harness y desarrollo guiado por especificaciones, usando especificaciones, límites de seguridad y validación automatizada para orientar agentes de programación con IA.",
      "Actualmente, curso un posgrado en Ingeniería de Software para IA Aplicada en UNIPDS.",
    ],
    metadataDescription: "Henrique Rocha Serrano, Ingeniero de Software Sénior en Lena, en Río de Janeiro. Desarrollo full-stack y móvil, soluciones basadas en IA e ingeniería de harness.",
  },
}
const seniorPT = "Engenheiro de Software Sênior"
const seniorES = "Ingeniero de Software Sénior"
const developerPT = "Desenvolvedor de Software"
const developerES = "Desarrollador de Software"
const jobs: Record<"pt-BR" | "es", Record<string, JobTranslation>> = {
  "pt-BR": {
    lena: { role: seniorPT, description: [
      "Desenvolvo uma plataforma de coordenação de cuidados baseada em IA que conecta agentes de IA a pacientes por chamadas telefônicas e SMS, com análises de chamadas revisadas por agentes e coordenadores de cuidados.",
      "Trabalho com Next.js, TypeScript, Prisma, Python e AWS e uso engenharia de harness, especificações, diretrizes de segurança e validação automatizada para orientar agentes de programação com IA.",
    ] },
    ish: { role: seniorPT, description: [
      "Desenvolvi sistemas de gestão de incidentes e vulnerabilidades de cibersegurança, incluindo APIs, permissões, painéis e geração de relatórios em serviços TypeScript, Python e Java.",
      "Ajudei a migrar uma API Django para NestJS, otimizar consultas PostgreSQL e orientar colegas, com testes automatizados e CI/CD no GitHub Actions.",
    ] },
    lendingclub: { role: seniorPT, description: ["Desenvolvi funcionalidades para a nova experiência de internet banking da LendingClub com React e TypeScript, contribuindo do planejamento da experiência do usuário ao desenvolvimento com componentes de interface internos e renderização no servidor com Django."] },
    questrade: { role: seniorPT, description: ["Desenvolvi um aplicativo mobile de negociação de ações com React Native, TypeScript e MobX. Ajudei a documentar projetos e apoiar a transição de desenvolvedores da Vizir após sua aquisição pela Questrade."] },
    vizir: { role: developerPT, description: ["Trabalhei no desenvolvimento web, mobile e backend para Vizir Bank e Natura Pay. Usei micro frontends e Webpack Module Federation para compartilhar dependências entre aplicativos bancários."] },
    "will-bank": { role: developerPT, description: ["Desenvolvi sistemas internos de atendimento ao cliente com React, TypeScript, Node.js e NestJS, colaborando com atendentes na concepção de funcionalidades. Também contribuí com funcionalidades mobile em Flutter e migrei serviços backend de Node.js para NestJS."] },
    inflor: { role: developerPT, description: ["Desenvolvi sistemas web responsivos para gestão florestal e agrícola com Vue.js, Vue Router, Vuex, Vuetify e Sass."] },
    techpark: { role: developerPT, description: ["Desenvolvi APIs Node.js, microsserviços e bancos de dados MongoDB/PostgreSQL na AWS para uma plataforma de autoescolas. Criei um aplicativo Flutter para alunos gerenciarem aulas teóricas e práticas."] },
    banestes: { role: "Suporte Técnico", description: ["Prestei suporte a serviços web e aplicativos de Internet Banking e ao Office Banking, usando SQL, PowerShell e scripts Python para automatizar o trabalho de suporte."] },
  },
  es: {
    lena: { role: seniorES, description: [
      "Desarrollo una plataforma de coordinación de cuidados basada en IA que conecta agentes de IA con pacientes mediante llamadas telefónicas y SMS, con análisis de llamadas revisados por agentes y coordinadores de cuidados.",
      "Trabajo con Next.js, TypeScript, Prisma, Python y AWS y uso ingeniería de harness, especificaciones, límites de seguridad y validación automatizada para orientar agentes de programación con IA.",
    ] },
    ish: { role: seniorES, description: [
      "Desarrollé sistemas de gestión de incidentes y vulnerabilidades de ciberseguridad, incluidas APIs, permisos, paneles y generación de informes en servicios TypeScript, Python y Java.",
      "Ayudé a migrar una API Django a NestJS, optimizar consultas PostgreSQL y orientar a compañeros, con pruebas automatizadas y CI/CD en GitHub Actions.",
    ] },
    lendingclub: { role: seniorES, description: ["Desarrollé funcionalidades para la nueva experiencia de banca por internet de LendingClub con React y TypeScript, contribuyendo desde la planificación de la experiencia del usuario hasta el desarrollo con componentes de interfaz internos y renderizado en el servidor con Django."] },
    questrade: { role: seniorES, description: ["Desarrollé una aplicación móvil de compraventa de acciones con React Native, TypeScript y MobX. Ayudé a documentar proyectos y apoyar la transición de desarrolladores de Vizir tras su adquisición por Questrade."] },
    vizir: { role: developerES, description: ["Trabajé en desarrollo web, móvil y backend para Vizir Bank y Natura Pay. Utilicé micro frontends y Webpack Module Federation para compartir dependencias entre aplicaciones bancarias."] },
    "will-bank": { role: developerES, description: ["Desarrollé sistemas internos de atención al cliente con React, TypeScript, Node.js y NestJS, colaborando con los agentes de atención en el diseño de funcionalidades. También contribuí con funcionalidades móviles en Flutter y migré servicios backend de Node.js a NestJS."] },
    inflor: { role: developerES, description: ["Desarrollé sistemas web adaptables para la gestión forestal y agrícola con Vue.js, Vue Router, Vuex, Vuetify y Sass."] },
    techpark: { role: developerES, description: ["Desarrollé APIs Node.js, microservicios y bases de datos MongoDB/PostgreSQL en AWS para una plataforma de autoescuelas. Creé una aplicación Flutter para que los alumnos gestionaran clases teóricas y prácticas."] },
    banestes: { role: "Soporte Técnico", description: ["Presté soporte a servicios web y aplicaciones de Internet Banking y a Office Banking, usando SQL, PowerShell y scripts Python para automatizar el trabajo de soporte."] },
  },
}
const studies: Record<"pt-BR" | "es", Record<string, StudyTranslation>> = {
  "pt-BR": { unipds: { program: "Pós-graduação em Engenharia de Software para IA Aplicada", field: "Ciência da Computação" }, estacio: { program: "Bacharelado", field: "Ciência da Computação" } },
  es: { unipds: { program: "Posgrado en Ingeniería de Software para IA Aplicada", field: "Ciencias de la Computación" }, estacio: { program: "Grado universitario", field: "Ciencias de la Computación" } },
}
const translatedSkills: Record<"pt-BR" | "es", Partial<Record<SkillId, string>>> = {
  "pt-BR": { "harness-engineering": "Engenharia de Harness", "spec-driven-development": "Desenvolvimento de Software Orientado por Especificações", ai: "Inteligência Artificial (IA)", "ai-agents": "Agentes de IA", "unit-testing": "Testes Unitários", "api-development": "Desenvolvimento de API" },
  es: { "harness-engineering": "Ingeniería de Harness", "spec-driven-development": "Desarrollo de Software Guiado por Especificaciones", ai: "Inteligencia Artificial (IA)", "ai-agents": "Agentes de IA", "unit-testing": "Pruebas Unitarias", "api-development": "Desarrollo de API" },
}
export function getMessages(locale: SiteLocale) {
  return {
    ui: locale === "en" ? englishUI : locale === "pt-BR" ? portugueseUI : spanishUI,
    introduction: locale === "en" ? profileIntroduction : introductions[locale],
    employment: locale === "en" ? employment : employment.map(entry => {
      const translation = jobs[locale][entry.id]
      if (!translation || translation.description.length !== entry.description.length || !translation.role || translation.description.some(paragraph => !paragraph.trim())) {
        throw new Error(`Missing or incomplete ${locale} employment translation: ${entry.id}`)
      }
      return { ...entry, ...translation }
    }),
    education: locale === "en" ? education : education.map(entry => {
      const translation = studies[locale][entry.id]
      if (!translation?.program || !translation.field) throw new Error(`Missing ${locale} education translation: ${entry.id}`)
      return { ...entry, ...translation }
    }),
    skillLabels: Object.fromEntries(Object.entries(skills).map(([id, skill]) => [id, locale === "en" ? skill.label : translatedSkills[locale][id as SkillId] ?? skill.label])) as Record<SkillId, string>,
  }
}
export type Messages = ReturnType<typeof getMessages>
