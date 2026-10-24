# Website design

The ReLeaf website helps developers understand the library, try it, and reach a working implementation. It shares the [product direction](../PRODUCT.md) with the package; [library architecture](../DESIGN.md) remains separate from the site's visual identity.

## Structure and content

The site is a Vite React application with two HTML entrypoints: `index.html` for the landing page and `api/index.html` for the API reference. Both use `main.tsx`; the document's `data-page` selects the view. Shared navigation and footer connect documentation, examples, setup, and the GitHub repository.

The landing page follows the developer's decision process:

1. A concise promise, compatibility information, install command, and setup link.
2. A real interactive Lisbon map showing what ReLeaf builds.
3. Selectable examples pairing live maps with short code snippets.
4. Capability summaries and a final invitation to start building.

The API reference renders repository-owned `../docs/api.md` through Marked, with Highlight.js for code. Its sidebar derives section links from second-level headings and filters their titles; it is not full-text search. Edit the Markdown source rather than maintaining a second API guide in JSX.

Headings have shareable hash anchors. Preserve existing links when changing headings, and retain the redirect for historical landing-page `#api` links. Relative page and asset URLs support GitHub Pages repository subpaths without server-side route rewrites.

## Visual language

The current direction is calm, botanical, and editorial: warm paper, forest green, restrained borders, generous whitespace, and working maps as the main visual evidence. Use the `{Re}Leaf` wordmark and leaf mark consistently. Copy should be short and concrete, with technical claims grounded in the package.

| Role | Current reference |
| --- | --- |
| Page surface | `--paper: #f8f9f3` |
| Primary green | `--green: #254e39` |
| Body text | `#263c2f` |
| Muted text | `--muted: #737b6e` |
| Borders | `--line: #dfe4d7` |
| Code surface | `#1e3029` |
| Body type | DM Sans with sans-serif fallback |
| Display type | Manrope with sans-serif fallback |
| Display emphasis | Georgia italic |

`style.css` is the source of truth for exact values. Use subtle shadows, modest rounding, and fine separators. The desktop hero uses a slightly rotated map frame; mobile removes that rotation. Code panels use dark green surfaces with readable syntax colors and horizontal scrolling. Keep technical reference text denser and quieter than landing-page display typography.

Website theme and resets are local to this application. The actual demos import the library stylesheet and apply scoped control adjustments to work without Preflight. Avoid broad Leaflet or button overrides that accidentally affect attribution, popups, or unrelated site controls.

## Layout and interaction

Content generally caps at 1440px. The desktop hero and examples use two columns, feature summaries use three, and documentation uses a sticky sidebar beside a flexible article. Existing breakpoints at 950px and 650px reduce spacing and collapse layouts. On small screens, navigation becomes a toggle, examples and features stack, and the documentation sidebar moves above the article.

Keep code blocks and API tables independently scrollable without forcing the page wider than the viewport. Map containers require explicit heights. The hero disables scroll-wheel zoom so ordinary page scrolling remains predictable.

Live demos import `../src` and must continue exercising actual library components. Keep code snippets aligned with the interaction they demonstrate, and clearly supply any omitted surrounding setup in nearby documentation. Leaflet marker image URLs are explicitly imported so hashed assets work under repository subpaths.

Copy controls report success or failure and reset their feedback. Preserve visible focus styles, the skip-to-content control, map labels, navigation labels, mobile expansion state, and live feedback. Respect reduced-motion preferences. Interactive map overlays must leave map controls and provider attribution reachable.

## Runtime and deployment

The site is a static build with no application backend. Maps load external OpenStreetMap tiles, and fonts are optionally loaded from Google Fonts with local fallbacks. Keep navigation and reference content useful when those external resources are unavailable. The current Markdown-to-HTML path trusts checked-in documentation; it must not accept untrusted user HTML without revisiting that boundary.

Vite uses `base: "./"` and writes to `../website-dist/`. The header version comes from the latest Git tag available at build time, falling back to `unreleased`; it is not taken from `package.json`. The GitHub Pages workflow builds and deploys pushes to `main` and manual workflow runs.

Validate with `bun run build:website` from the repository root. For UI changes, inspect both pages at desktop and mobile widths, then exercise navigation, section filtering, anchors, copying, example selection, map controls, and keyboard focus. Check production assets and page links under a repository subpath when changing routing or build configuration. Do not edit generated `website-dist/` files.
