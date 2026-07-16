# Working in TickyTocky

## Priorities

Prioritise, in this order: clarity, accessibility, stability, and performance.
The site should teach first and impress second.

## Commands

- Install dependencies: `corepack pnpm install`
- Start the app: `corepack pnpm dev`
- Run static checks and the production build: `corepack pnpm check`
- Run browser tests: `corepack pnpm test:e2e`
- Format files: `corepack pnpm format`

Run commands from the repository root. Do not weaken a project-wide check to
make a local change pass.

## Architecture

- `src/main.tsx` is the browser composition root. Keep runtime setup there.
- `src/app.tsx` owns the page shell and composes major areas.
- Keep a flat `src` directory until a feature has enough related files to earn
  a named module.
- The future `experience` module will own the Three.js scene, animation
  timeline, and scroll-to-progress mapping behind one small interface.
- Educational copy and watch metadata belong to a future `content` module,
  independent of React and Three.js.
- Keep Three.js, browser, and asset-loader types inside their adapters. Domain
  data should use application-owned types.
- Do not add a seam for a dependency with only one implementation unless the
  seam hides real policy or lifecycle complexity.

## 3D and animation

- Derive scene state from normalized progress so forward and reverse scrolling
  always reach the same pose.
- Give each animated property one owner. Do not let React, Anime.js, and a
  render-loop callback compete over the same transform.
- Never update React state on every frame. Mutate owned Three.js refs inside the
  scene coordinator.
- Keep explanatory text and controls in semantic HTML. The lesson must remain
  understandable when WebGL is unavailable.
- Respect `prefers-reduced-motion` with a complete manual or static path.
- Name GLB objects by domain concept. Do not depend on Blender-generated names
  such as `Object.001`.
- Dispose manually created geometry, materials, textures, observers, and
  animation timelines in the scope that owns them.
- Measure on a mid-range mobile device before adding post-processing, dynamic
  shadows, high device-pixel ratios, or large textures.

## TypeScript and React

- Avoid `any`, non-null assertions, unchecked casts, and floating promises.
- Parse external data at its boundary and use the refined value afterward.
- Prefer inference for local values. Add explicit types where they define a
  module interface or prevent realistic misuse.
- Prefer named exports. Default exports are reserved for tool configuration
  files that require them.
- Do not alias or star-import modules.
- Prefer early returns, `const`, and direct property access.
- Keep single-use logic inline unless extraction names a real concept or hides
  a complex boundary.
- Use kebab-case filenames and PascalCase React component names.
- Avoid barrel files until a module needs one intentional public interface.

## Styling

- Use Tailwind for layout and common utilities.
- Put visual identity in CSS variables and authored CSS rather than default
  Tailwind colors or generic component-library themes.
- Do not add a UI component library until repeated interaction patterns justify
  one.
- Keep focus states, contrast, keyboard use, touch targets, and readable motion
  in the first version of an interaction.

## Testing

- Test user-visible behavior through the browser with Playwright.
- Test pure timeline, geometry, and domain rules with Vitest once those modules
  exist.
- Avoid mocks when the real browser or implementation can run locally.
- Add visual snapshots only for stable states with a clear regression signal.

## Git

- Use conventional commits: `type(scope): summary`.
- Valid types are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`.
- Keep branch names short, lowercase, and hyphen-separated.

## Security

- Never commit credentials, tokens, private keys, or production data.
- Keep local secrets in ignored `.env.*` or `.dev.vars.*` files. Commit only
  placeholder examples such as `.env.example`.
- Treat every `VITE_` variable as public. Vite embeds it in browser JavaScript.
- Parse untrusted configuration and network data at the boundary before use.
- Do not log secrets, complete environment objects, or arbitrary external data.
- Before committing, inspect both `git status` and the staged diff. `.gitignore`
  does not protect a secret that is already tracked.
