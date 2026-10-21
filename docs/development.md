# Development

[← README](../README.md)

```sh
bun install
bun run typecheck
bun run test
bun run build
```

Vitest tests exercise the source against real Leaflet in jsdom, plus
server rendering and published-entrypoint checks in fresh Node processes.

The test setup builds the package before running, including runs from VS Code.

Consumer type fixtures check the emitted declarations through `releaf` and `releaf/events`, including expected errors.

```sh
bun run test                 # Build and run Vitest/jsdom integration tests
bun run test:coverage        # Build and report integration coverage (console + LCOV)
bun run test:watch           # Watch integration tests with Vitest
bun run test:types           # Build and check test code and consumer types
bunx playwright install --with-deps chromium firefox webkit
bun run test:browser         # Build and run all three browser engines
bun run test:browser --project=chromium
bun run test:all             # Source types, integration, test types, browsers
```


In VS Code, the existing Vitest extension discovers `vitest.config.ts`. Open the
Testing view and choose **Run Tests with Coverage** to populate VS Code's Test
Coverage view and source coverage overlays. Use **Test: Show Inline Coverage**
to toggle the overlay.

GitHub Actions runs integration tests with coverage, type checks, lint, and separate Chromium,
Firefox, and WebKit jobs on pushes and pull requests. Dependency versions are
recorded in `bun.lock`; CI installs with `bun install --frozen-lockfile`.


## Storybook development

```sh
bun install
bun run storybook
```

Open **http://localhost:6006**. Storybook imports the library source directly,
so edits to `src/` refresh the examples without rebuilding `dist/`.

The library owns its [shadcn/ui](https://ui.shadcn.com/docs/installation/manual)
Button and Input in `src/components/ui/`, with shared utilities in `src/lib/`.
Map actions and search use these primitives internally; Storybook shares the same
Button. `components.json` targets `src/` through the root TypeScript `@/` alias.
Storybook retains its own `@/` alias for example imports.

UI runtime dependencies are published dependencies. The build emits
`dist/styles.css` using Tailwind v4 through Vite; consumers import
`releaf/styles.css` without needing Tailwind. The stylesheet excludes Preflight
and uses inherited shadcn theme tokens with neutral fallbacks.

```sh
bun run build-storybook       # Generate storybook-static/
bun run typecheck:stories     # Check examples and Storybook configuration
bun run lint                 # Check library, stories, and configuration
```

Storybook uses the [React + Vite framework](https://storybook.js.org/docs/get-started/frameworks/react-vite).
