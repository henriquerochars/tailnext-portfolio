# Henrique Rocha Dev Portfolio

Personal portfolio built with Next.js and Tailwind CSS and deployed on Vercel.

## Requirements

- Node.js 24.x
- Yarn 1.x

If you use `nvm`, run:

```bash
nvm use
```

The repository includes an `.nvmrc` file pinned to Node.js 24.

## Running locally

Install dependencies using the existing Yarn lockfile:

```bash
yarn install --frozen-lockfile
```

Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

## Production build

```bash
yarn build
yarn start
```

## Deployment

The project is deployed on Vercel. The Node.js runtime is declared in `package.json` through `engines.node`, so Vercel builds and functions use Node.js 24.x.
