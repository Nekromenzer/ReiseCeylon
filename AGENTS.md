# Repository Guidelines

## Project Structure & Module Organization

This repository is currently design-first. The root `design.md` file is the source of truth for ReiseCeylon’s brand tokens, typography, reusable component specifications, and visual guidance. Keep documentation changes there until an application scaffold is introduced.

When adding the planned React/Next.js implementation, use `src/app/` for routes, `src/components/` for shared UI, `src/lib/` for utilities and data access, and `public/` for static assets. Place tests beside their subjects as `*.test.ts` or `*.test.tsx`; reserve `tests/e2e/` for complete booking and discovery flows. Avoid committing generated output such as `.next/`, `dist/`, or coverage reports.

## Build, Test, and Development Commands

No package manifest or executable application exists yet, so there are currently no repository-defined build, test, or development commands. After scaffolding, expose the standard workflow through `package.json`:

- `npm run dev` — start the local development server.
- `npm run build` — create and validate the production build.
- `npm run lint` — run configured static analysis.
- `npm test` — execute the automated test suite.

Document any added command in `README.md`, and keep scripts CI-friendly and non-interactive.

## Coding Style & Naming Conventions

Use TypeScript for application code, two-space indentation, semicolons, and single quotes unless the selected formatter dictates otherwise. Name React components in PascalCase (`DestinationCard.tsx`), hooks with a `use` prefix (`useItinerary.ts`), and utilities in camelCase. Route and asset directories should use lowercase kebab-case.

Do not duplicate brand values in components. Translate the colors, spacing, radii, and typography from `design.md` into shared tokens. Preserve the Forest Green, Heritage Gold, Ocean Teal, and Soft Ivory hierarchy, including accessible focus and dark-mode states.

## Testing Guidelines

Add unit tests for utilities and interaction tests for forms, filters, navigation, and booking controls. Test user-visible behavior rather than component internals. New features should cover their primary success path, validation failures, keyboard use, and relevant light/dark variants. Run lint, tests, and the production build before requesting review.

## Commit & Pull Request Guidelines

Git history is unavailable in this workspace, so no existing commit convention can be inferred. Use concise, imperative commits, preferably Conventional Commits such as `feat: add destination search`.

Pull requests should explain the change, validation performed, and any design-token impact. Link relevant issues and include before/after screenshots for visual work, covering responsive and dark-mode states when applicable.
