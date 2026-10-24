# Working on ReLeaf

ReLeaf is a typed React wrapper for Leaflet with composable controls and a public documentation website. This file applies throughout the repository.

## Read first

- [PRODUCT.md](PRODUCT.md): audience, scope, and product decisions.
- [DESIGN.md](DESIGN.md): library architecture and API constraints.
- [website/DESIGN.md](website/DESIGN.md): website structure and visual language.
- [docs/api.md](docs/api.md): current public API; [docs/development.md](docs/development.md): development workflow.
- [DSL.md](DSL.md): compound API intent and examples. Some examples use historical `@releaf` imports; published entrypoints are `releaf` and `releaf/events`. Verify examples against source and consumer types.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/index.ts`, `src/events.ts` | Published JavaScript and declaration entrypoints |
| `src/map/`, `src/context.ts` | Map ownership, readiness, context, subscriptions, attribution |
| `src/layers/`, `src/overlays/` | Leaflet layers and React popup/tooltip content |
| `src/dsl-core/`, `src/dsl.tsx` | Compound `Map` API and actions |
| `src/controls/`, `src/search/`, `src/location.ts` | Composed controls, async search, geolocation |
| `src/components/ui/`, `src/styles.css` | Internal shadcn primitives and distributed styles |
| `stories/` | Interactive examples importing source directly |
| `tests/integration/`, `tests/types/`, `tests/browser/` | Runtime contracts, consumer declarations, browser behavior |
| `website/` | Vite landing page and API reference |
| `.github/workflows/` | Test pipeline and GitHub Pages deployment |

## Implementation rules

- Use Bun and retain `bun.lock`. CI uses Bun 1.3.12 and Node 22.
- Follow adjacent TypeScript and React conventions: two spaces, no unnecessary semicolons, and type-only imports where appropriate. Biome is the formatter and linter.
- Keep Leaflet runtime loading inside the browser lifecycle of the library. Use type imports at module scope; avoid introducing server-side access to `window`, `document`, or `navigator` during package import or rendering.
- Pair Leaflet creation and event registration with cleanup. Preserve Strict Mode behavior, fresh event callbacks, and stable map ownership across rerenders.
- Keep the low-level API and compound API consistent. Preserve existing public exports and compatibility aliases unless a breaking change is explicitly in scope.
- Prefer composing existing primitives. Allow custom child buttons, theme variables, `className`, and icon overrides rather than hardcoding application styling into controls.
- Keep search provider-independent and cancellation-safe. Request location from an explicit user action and retain pending, denied, failure, and retry feedback.
- Preserve provider attribution when customizing the map footer.
- Update `docs/api.md` for public API changes and examples or consumer type fixtures when their contracts change. The website renders this guide directly.
- Edit source files rather than generated `dist/`, `website-dist/`, `storybook-static/`, coverage, or test output. Do not hand-edit the lockfile.

## Development and validation

Install with `bun install`; use `bun install --frozen-lockfile` when verifying the existing dependency graph. Useful local servers are `bun run storybook` and `bun run dev:website`.

Before completing any task, always:

- Run `bun run lint` (Biome) and `bun run doctor` (React Doctor), including for documentation-only changes. Review their output and fix issues introduced by the task.
- Review whether documentation and tests need updating. Update relevant guides, examples, and design/product documents when behavior, APIs, architecture, or workflows change. Add or update meaningful tests when behavior or contracts change, and run the affected tests.
- Report validation results and any remaining findings. If a required check cannot run, state the blocker explicitly rather than silently skipping it.

Run additional checks based on the change:

| Change | Checks |
| --- | --- |
| Library behavior | `bun run typecheck`, `bun run test`, `bun run lint` |
| Public exports or types | Above plus `bun run test:types` |
| Leaflet interactions, lifecycle, focus, or layout | Relevant Playwright cases via `bun run test:browser`; full browser validation covers Chromium, Firefox, and WebKit |
| Stories | `bun run typecheck:stories`; `bun run build-storybook` for bundling changes |
| Website | `bun run build:website`; inspect affected pages at desktop and mobile widths for UI changes |
| Documentation only | Review against source and verify local links; build the website when changing rendered API content |

`bun run test` builds the package through the test setup. `bun run test:types` and `bun run test:browser` also build it. `bun run test:all` combines source types, integration tests, consumer types, and browsers; it does not include every website or Storybook check. Browser tests require installed Playwright browsers; setup is documented in the development guide.

Add regression coverage for changed behavior at the relevant layer. Report what was verified and any checks that could not run. Keep unrelated changes out of the patch.
