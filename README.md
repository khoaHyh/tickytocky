# TickyTocky

An interactive guide to mechanical watches. The project will use scroll-driven
3D lessons to show how a watch stores energy, regulates time, and moves its
displays.

The repository currently contains the application foundation. The first 3D
lesson has not been implemented yet.

## Stack

- React and TypeScript
- Vite with Rolldown and Oxc
- Three.js, React Three Fiber, and Drei
- Anime.js
- Tailwind CSS
- Oxlint and Oxfmt
- Vitest and Playwright

## Requirements

- Node.js 24
- Corepack

## Local development

```sh
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Verification

```sh
pnpm check
pnpm test:e2e
```

`pnpm check` verifies formatting, lint rules, TypeScript, unit tests, and the
production build. Playwright separately verifies the rendered browser seam.

## Deployment

The production output is a static `dist` directory suitable for Cloudflare
Pages. Large 3D assets will move to Cloudflare R2 if they exceed the Pages
per-file limit.
