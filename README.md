# TickyTocky

An interactive guide to mechanical watches. The project will use scroll-driven
3D lessons to show how a watch stores energy, regulates time, and moves its
displays.

The repository contains a self-authored, semantically named GLB watch model.
Native page scroll deterministically separates and rebuilds the watch while
semantic HTML explains each functional group. The display chapter compares the
generic 12:1 motion of the minute and hour hands. The regulation chapter includes
a controllable generic Swiss lever lesson for lock, unlock, impulse, and drop.
The power chapter traces energy from a windable mainspring through the going train,
and the Assembly chapter composes all three jobs behind one illustrative clock.

The current geometry is an educational tracer, not an exact NH34 reproduction.

## Stack

- React and TypeScript
- Vite with Rolldown and Oxc
- Three.js, React Three Fiber, and Drei
- Tailwind CSS
- Oxlint and Oxfmt
- Vitest and Playwright

## Requirements

- Node.js 24
- Corepack
- Python 3.11 or newer

## Local development

```sh
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Watch model

The model is generated from a text-based Blender script and optimized with
Meshopt compression:

```sh
pnpm asset:watch
```

Regenerating the asset requires Blender 4.5 LTS on `PATH`, at the standard macOS
application path, or supplied through `BLENDER_BIN`. The current artifact was
validated with Blender 4.5.9 LTS; another patch may produce different bytes and
should be checked through the same model and browser validation. Modeling sources
and rights are recorded in `public/models/PROVENANCE.md`.

## Verification

```sh
pnpm check
pnpm test:e2e
```

`pnpm check` verifies formatting, lint rules, TypeScript, the Python generator
contract, unit tests, and the production build. Playwright rebuilds the app,
serves `dist` through Vite Preview, and verifies the production browser seam.

The same commands run in CI for pushes to `main` and pull requests.

## Deployment

Run `pnpm build` and publish the resulting static `dist` directory. The host must
serve `index.html` at the site root and preserve the generated
`/models/watch-model.glb` path. No server runtime or provider-specific integration
is required.
