# Repository Guidelines

## Project Structure & Module Organization
The Vue 3 client resides in `src/`: `components/` for shared UI, `pages/` for route views, `composables/` for reuse, and `lib/` for helpers. Alias `@` points to `src`. The Express API lives in `api/` with entry `server.ts`, routes grouped under `api/routes/`, middleware in `api/middleware/`, and SQLite access in `api/database/`. Domain contracts stay in `shared/types.ts`; always evolve client and server together. Local seed data sits in `data/inventory.json` alongside the SQL bootstrap in `api/database/init.sql`. Use `public/` for static assets and treat `dist/` as build output only.

## Build, Test, and Development Commands
- `pnpm install`: install workspace dependencies.
- `pnpm run dev`: start Vite and the nodemon API concurrently.
- `pnpm run client:dev`: run only the client while mocking the backend.
- `pnpm run server:dev`: run only the API; loads `.env` and reloads on change.
- `pnpm run build`: type-check with `vue-tsc` then emit production bundles.
- `pnpm run preview`: serve the built client.
- `pnpm run check`: project-wide TypeScript validation.
- `pnpm run lint` / `pnpm run lint:fix`: ESLint for `.ts`/`.vue` files.

## Coding Style & Naming Conventions
Stick to TypeScript, reuse `shared/types.ts`, and keep composables named `useX`. Vue SFCs follow PascalCase filenames, routes and stores use camelCase, and Express files stay kebab-case. Preserve two-space indentation, single quotes in TS, and trailing commas on multi-line literals. Let ESLint and Vite handle formatting; never touch `dist/` manually.

## Testing Guidelines
Automated tests are still being introduced. Add Vitest plus Vue Test Utils specs under `src/__tests__/` and supertest-based API checks alongside the relevant route. Target 80% coverage for new logic, capture manual QA steps in the PR, and include sample requests or UI screenshots when they clarify behaviour.

## Commit & Pull Request Guidelines
Write imperative subject lines such as `fix: handle expired tokens`, with optional short bodies for context. Squash WIP commits before review. Each PR should explain the change, list commands run, link issues, and attach UI evidence for visible updates. Call out modifications to SQL, `shared/types.ts`, or `data/inventory.json` so reviewers can refresh their setup.

## Environment & Security Notes
Create a `.env` at the repo root for local runs; define `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and any external API keys you introduce. Do not commit secrets or production datasets. When touching authentication or authorization, include a risk summary and regression focus areas for reviewers.
