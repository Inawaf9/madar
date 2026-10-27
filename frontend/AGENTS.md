<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Frontend engineering conventions

- Preserve public routes, API payloads, auth/session behavior, locale behavior, and existing UI while refactoring. Read the installed Next.js documentation before changing App Router files.
- Keep `app/`, `features/`, `components/`, `lib/`, `hooks/`, `i18n/`, and `messages/` directly under the frontend root. Never create `src/`, `source/`, or `client/` as an alternative source root; use the existing `@/*` alias.
- Keep `app/` focused on routing and composition, domain behavior in its owning `features/` area, reusable domain-independent presentation in `components/`, and shared technical infrastructure in `lib/`. Keep feature-specific components and hooks inside their feature; create optional `components/`, `hooks/`, or `utils/` folders only when the feature is large enough to justify them.
- Cross-feature consumers may import explicit public modules at a feature root; never import another feature's private `components/`, `hooks/`, or `utils/` directory. Do not use broad barrels, duplicate implementations, or feature dependency cycles. Run `pnpm check:architecture` after structural changes.
- Keep Server Components by default. Put browser state in the smallest practical Client Component; never import secrets or `.server` modules into client code.
- Format changed source with Prettier (`printWidth: 90`, `tabWidth: 2`, `singleAttributePerLine: true`, `bracketSameLine: false`) and run `pnpm format:check` before completing a refactor.
- Write nested JSX on multiple lines with clear indentation. Put multiline attributes on separate lines. Replace deeply nested render branches with named components when that clarifies responsibility. Keep semantic HTML and accessible names.
- Give components one coherent responsibility. Use named handlers for multiple business operations, define reusable schemas outside render, and extract state coordination into a hook when it reduces complexity. Avoid trivial wrappers and generic service/repository layers.
- Use kebab-case filenames except Next.js file conventions. Preserve React Hook Form validation, error mapping, pending state, and query cache keys when reorganizing forms or hooks. Keep typed backend API clients and BFF contracts in the existing `lib/api` and `app/api` locations.
- Preserve existing Tailwind classes, theme tokens, responsive behavior, animations, and RTL/LTR direction during formatting. Do not reorder classes merely for style.
- Add translations to the existing locale namespace source files under `messages/ar/` and `messages/en/`; keep keys and interpolation tags aligned. The existing TypeScript copy resources live under `messages/`, and the location-name dictionary belongs to `features/locations/messages`. Run `pnpm check:i18n`.
- Before moving files, inspect callers and resolved routes. Run TypeScript, ESLint, relevant tests, and a production build for meaningful structural changes. Record unverified browser or backend behavior honestly.
