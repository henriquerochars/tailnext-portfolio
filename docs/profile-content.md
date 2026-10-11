Status: Live
Owner: [Issue #19](https://github.com/henriquerochars/tailnext-portfolio/issues/19)
Source: Owner-selected on-request workflow; rendered LinkedIn profile inspected on 2026-10-11.

# Professional content updates

## Content contract

The [LinkedIn profile](https://www.linkedin.com/in/henriquerochaserrano/) is the professional factual source. Update the portfolio when the owner asks for a refresh. Read the rendered profile through the browser and commit reviewed content; the public site renders repository data without contacting LinkedIn.

`data/public-profile.ts` holds public copy and destinations used by interactive components. `data/profile.ts` holds the complete typed career, normalized global skill catalog, original source labels, top skills, curated visible skills and per-entry associations. Keep the complete career catalog out of client imports. Experience/Education render this model on the server; the redesign belongs to #21.

The Experience timeline displays every employment entry in the stored reverse chronological order. Education follows, with the current program first. Dates retain month/year or year-only precision, current employment uses “Present”, and in-progress education labels its end date “(expected)”. The timelines display every verified associated skill in stored order. Verified-empty and pending entries have no public skill list; description technologies are never substituted for associations.

The editorial presentation in #21 keeps the three most recent roles expanded and groups all earlier roles in one initially closed native disclosure. Both groups use the same entry renderer and server-side source data; no descriptions or skills are abbreviated. All nine entries remain in the HTML, and an individual entry fragment reveals its containing disclosure. About retains the ordered 12 featured skills. The profile becomes a lateral column from 1280px, with sticky positioning only when its measured height fits the viewport; narrower layouts use one column and persistent compact navigation. Theme selection explicitly supports Light, Dark and System. This changes presentation, not the reviewed facts, public destinations or source-refresh procedure.

The selected scope is headline, summary, jobs, education, skills and professional links. Certifications, languages, posts, recommendations, private account information and recruiter-only settings are outside this update. PDF resumes and data exports are not required. Preserve the existing portrait and illustration.

## Repeatable update procedure

1. Read the engineering instructions and create an owned task branch/worktree from current `final`. Read the existing profile data and this review matrix before collecting replacements.
2. Open the canonical profile in the browser. Use an available authenticated session when needed. If login or a required view is unavailable, ask the owner to restore access and record the missing evidence. Keep existing content until the missing sections can be inspected.
3. Read the headline, location and complete About copy. Open the complete Experience and Education views, expand truncated descriptions, and account for every entry, including earlier support roles. Follow the profile's visible navigation; do not depend on permanent selectors or a hidden LinkedIn API.
4. Open each entry's full skill-association list, including every “+N skills” list. Read the global Skills view through its final entry, loading all pages as needed. Capture the separate Top Skills list. Deduplicate repeated UI labels and discard recommendations, endorsements, durations and interface text.
5. Reconcile names, roles, descriptions and dates against the previous committed data. Keep stable IDs, reverse chronological employment, current employment with `end: null`, year-only dates where appropriate, and in-progress education with its expected end date. Confirm conflicting facts and proposed removals with the owner. An incomplete reading never proves a deletion.
6. Normalize equivalent skill names while retaining all original source labels. Update the global catalog and each entry's explicit associations separately. Keep description-derived technologies in `descriptionTechnologies`; do not infer associations from them or distribute global skills across entries.
7. Record the source URL, inspection date and association status for every entry. Use `verified` for a fully read association list, `verified-empty` only after inspecting the complete entry and cross-checking the global skills view, and `pending` with a concrete note for incomplete/ambiguous evidence. Ask the owner about ambiguous absences. Do not conclude the refresh with required verification pending.
8. Adapt factual English Hero/About copy and propose up to 12 visible skills aligned with the current professional positioning. Review the copy and selection with the owner. Preserve the explicitly confirmed destinations below; profile refreshes do not silently replace these with stale links.
9. Update this matrix and source dates alongside the data. Update the initial-inventory assertions deliberately when the profile gains or loses reviewed entries; the current counts are not schema limits. Run the exact-revision engineering workflow, including data assertions, production browser tests and responsive/theme screenshots. Review the screenshots and request independent review at the final candidate SHA.
10. Deliver a PR documenting source differences, editorial review, verification results and unresolved limitations. Merge and production promotion are separate actions.

Keep raw PDF/archive files, full-page LinkedIn captures, cookies, private contact details, account analytics, messages and availability visible only to recruiters out of the repository and public PR. Evidence should contain selected professional data and rendered-portfolio screenshots.

## Confirmed destinations

- Portfolio: https://henriquerochadev.vercel.app
- Blog: https://henriquerochadevblog.vercel.app
- LinkedIn: https://www.linkedin.com/in/henriquerochaserrano/
- GitHub: https://github.com/henriquerochars
- Twitter: https://twitter.com/henriquerochars

The previously exported `henriquerochablogdev.vercel.app` spelling is incorrect. Owner-confirmed destinations take precedence over stale profile artifacts.

## Source and normalization review

Inspected on **2026-10-11** through the owner's authenticated browser session: headline/About, all nine entries in the complete Experience view, both entries in the complete Education view, all nine available association dialogs, and the fully loaded global Skills view ending with Redis.

The source contains 59 global skill labels, normalized to 58 catalog identities. `AWS` and `Amazon Web Services` share one ID while retaining both source labels. Display aliases include React.js → React, Python (Programming Language) → Python, SASS → Sass, SCRUM → Scrum, the long continuous-integration label → CI/CD, and Desenvolvimento de API → API Development. The source spelling `Netilify` is retained rather than guessing a correction. Skill counts below refer to normalized identities; no entry association was lost during normalization.

Banestes and Estácio display no association list in their complete entries and are absent from the fully loaded global associations. This is recorded as verified empty, not as a claim that the owner lacks those skills. Banestes's SQL, PowerShell and Python remain description-derived technologies. Conversely, LendingClub's GraphQL association is retained even though GraphQL is absent from its role description.

UNIPDS is in progress: September 2026 to an expected September 2027. Estácio is completed, 2018–2022; no months are invented. Employment dates use month/year and Lena remains open-ended. Source duration strings are excluded.

## Skill-association review matrix

All sources below were inspected on 2026-10-11. The matrix documents factual collection; owner editorial acceptance and independent exact-revision review are recorded separately in the PR.

| Entry | Verification | Count | Associated skills | Evidence |
| --- | --- | --- | --- | --- |
| Lena | Verified | 15 | Python, AWS, Harness Engineering, Prisma ORM, AWS CloudFormation, Mantine UI, Amazon Relational Database Service (RDS), TypeScript, Artificial Intelligence (AI), PostgreSQL, Amazon ECS, AI Agents, Next.js, GitHub Actions, Spec-Driven Software Development | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/2642341567/skill-associations-details/?associationType=position) |
| ISH Tecnologia | Verified | 15 | Python, Node.js, JavaScript, Spring Boot, React, Django, NestJS, Java, TypeScript, PostgreSQL, Jest, Next.js, DevOps, Unit Testing, CI/CD | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/2232110735/skill-associations-details/?associationType=position) |
| LendingClub | Verified | 7 | Python, JavaScript, React, Django, TypeScript, GraphQL, Unit Testing | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/2116874334/skill-associations-details/?associationType=position) |
| Questrade Financial Group | Verified | 6 | JavaScript, React, TypeScript, Datadog, React Native, Unit Testing | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/1925964948/skill-associations-details/?associationType=position) |
| Vizir Software Studio | Verified | 7 | Node.js, JavaScript, React, TypeScript, React Native, Unit Testing, CI/CD | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/1764944168/skill-associations-details/?associationType=position) |
| will bank | Verified | 11 | Node.js, JavaScript, Flutter, AWS, Spring MVC, Spring Boot, React, NestJS, Java, TypeScript, Unit Testing | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/1671787967/skill-associations-details/?associationType=position) |
| INFLOR | Verified | 4 | JavaScript, Vuex, Vue.js, Vuetify | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/1505162474/skill-associations-details/?associationType=position) |
| Techpark - Tecnologia & Mobilidade | Verified | 10 | Node.js, JavaScript, Flutter, AWS, React, Amazon Relational Database Service (RDS), MongoDB, Express.js, PostgreSQL, Amazon EC2 | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/1357154726/skill-associations-details/?associationType=position) |
| Banestes | Verified empty | 0 | None displayed; full entry and global skills inspected | [Source](https://www.linkedin.com/in/henriquerochaserrano/details/experience/) |
| UNIPDS | Verified | 3 | Artificial Intelligence (AI), Spec-Driven Software Development, Harness Engineering | [Source](https://www.linkedin.com/in/henriquerochaserrano/overlay/1265204527/skill-associations-details/?associationType=education) |
| Estácio | Verified empty | 0 | None displayed; full entry and global skills inspected | [Source](https://www.linkedin.com/in/henriquerochaserrano/details/education/) |

## Current editorial proposal

Hero: “I'm a Senior Software Engineer at Lena, based in Rio de Janeiro, Brazil. I build full-stack and mobile products, with a current focus on AI-driven solutions.”

About summarizes full-stack/mobile work across financial services, cybersecurity and healthcare; current care-coordination work, harness engineering and spec-driven development; and the ongoing UNIPDS program. It introduces no metrics, availability claim or inferred qualification.

The selected 12 visible skills are TypeScript, JavaScript, React, Next.js, React Native, Node.js, NestJS, Python, AWS, Artificial Intelligence (AI), Harness Engineering and Spec-Driven Software Development. The full catalog and original Top Skills order remain available in the shared data. Owner review of this proposal must be recorded explicitly; implementation or passing tests do not imply editorial approval.
