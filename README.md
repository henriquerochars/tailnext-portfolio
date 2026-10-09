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
