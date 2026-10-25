Status: Live
Owner: Henrique Rocha Serrano
Source: Modern portfolio baseline and issue #17 implementation.

# Henrique Rocha Dev Portfolio

Personal portfolio for Henrique Rocha Serrano, built with Next.js and deployed on Vercel.

## Stack

- Next.js 16
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- next-themes
- Vercel

## Requirements

- Node.js 24.x
- Yarn 1.22.22

If you use `nvm`:

```bash
nvm use
```

## Local development

Install dependencies from the committed lockfile:

```bash
yarn install --frozen-lockfile
```

Start the development server:

```bash
yarn dev
```

Open `http://localhost:3000`.

## Quality checks

Run the same checks enforced by CI:

```bash
yarn typecheck
yarn lint
yarn build
```

## Production

Start a previously built production bundle with:

```bash
yarn start
```

The production site is deployed on Vercel at:

- https://henriquerochadev.vercel.app

The Node.js runtime is declared in `package.json` through `engines.node`.

## Engineering harness

Read the [engineering index](docs/engineering/index.md) and [reviewed setup](docs/engineering/bootstrap.md). Native macOS and Linux verification use Node 24.21.0 / Yarn 1.22.22; Vercel uses Node 24.x.

## Professional content

Follow the [LinkedIn content-update procedure and source review](docs/profile-content.md) when refreshing professional content. Updates happen on request through the browser, then become reviewed repository data. The site renders that versioned content.

## Latest blog posts

The homepage loads up to five recent published posts through `/api/blog-posts`. The server reads the blog's public `search.json` index, excludes drafts and invalid entries, sorts by publication date, and deduplicates post URLs. Titles and summaries remain in Portuguese, and dates use UTC to avoid shifting the publication day across time zones.

Successful responses refresh hourly; the homepage offers a retry and a link to the blog if the index is unavailable. No provider credentials or copied MDX are required. Runtime egress must allow HTTPS to `henriquerochadevblog.vercel.app`. Browser tests mock the same-origin endpoint; data and response tests cover selection, URL validation, caching and upstream failures without contacting the live blog.
