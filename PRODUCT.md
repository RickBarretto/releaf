# ReLeaf

ReLeaf helps React developers build interactive maps with their own components and controls. It combines a typed Leaflet wrapper, ready-made interactions, and a composition model that can grow from a simple map to a location picker or dashboard.

This document records direction grounded in the current repository. It is not a release schedule or a claim about package publication, adoption, or measured performance. Current API details live in [docs/api.md](docs/api.md).

## Register

product

## Users

The primary audience is React and TypeScript developers adding maps to applications, especially applications that already use shadcn/ui or have their own component system. Their end users need to explore places, select a location, search, or understand geographic data.

## Problem

Direct Leaflet integration requires lifecycle management, event subscriptions, DOM integration, and styling decisions. ReLeaf packages those recurring tasks into React components while retaining native access for advanced needs. Common tasks should take a small amount of readable code; customization should remain possible through the same primitives.

## Core journeys

| Developer goal | Expected outcome |
| --- | --- |
| Add a map | Declare a root, view, and tiles; import styles; get a correctly sized interactive map |
| Display geographic content | Compose markers, React popups/tooltips, shapes, groups, image overlays, or GeoJSON |
| Fit the host application | Use theme variables, custom classes, child buttons, and icon overrides |
| Navigate | Add zoom, home/fly-to, fit-bounds, and location actions through controls or hooks |
| Select a place | Combine map clicks, a draggable marker, coordinates, and selection callbacks |
| Search | Supply a search provider and receive typed selections with pending, empty, and error states |
| Request current location | Start from a user action, show feedback, and recover from denial or failure |
| Learn and evaluate | Try the website's live examples, follow setup, and find complete API details and Storybook compositions |

## Scope today

The package provides low-level Leaflet components and hooks, a compound `Map` API, and composed navigation, search, location, coordinate, layer-switching, and picker controls. It ships compiled styles with neutral theme fallbacks and supports server-safe importing and rendering before browser initialization.

The repository also includes Storybook, integration and consumer-type tests, browser tests, and a static landing page/API website. The website demonstrates the library and renders the shared API guide. Installation examples assume a published or locally linked package; the repository alone does not establish publication status.

## Product Purpose

Help developers ship interactive React maps with concise composition, useful defaults, and control over their UI. Support the path from a first map to search, location selection, and geographic dashboards without requiring a new integration model.

Success is evaluated through the acceptance criteria below: working setup, host-theme customization, reliable lifecycle behavior, recoverable requests, consistent public contracts, and usable documentation. These are quality goals; no adoption or performance baseline has been measured here.

## Brand Personality

Approachable, practical, precise, and quietly playful. The leaf identity gives ReLeaf warmth; working maps and readable examples establish credibility. The library should feel at home in the consumer's application, while the website can express its botanical identity.

### Tone

Use plain, concise language and concrete map tasks. Name setup requirements and failure states directly. Prefer runnable examples to broad claims. Avoid hype, unsupported performance comparisons, and promises about publication or compatibility that have not been verified.

## Anti-references

- Library controls MUST NOT impose the website's botanical colors or display typography on host applications.
- Examples MUST NOT imply that geocoding, routing, or tile hosting is provided by ReLeaf when an external provider is required.
- Product copy MUST NOT claim measured performance, adoption, or accessibility certification without evidence.
- Documentation MUST NOT hide required styles, dependencies, or provider setup behind apparently complete examples.

Specific external design inspirations remain unrecorded until the referenced conversation or site details are available.

## Design Principles

1. **Composition first.** Build common controls from reusable primitives. Offer convenient defaults without closing off customization.
2. **React ownership.** Components describe maps and own their lifecycles. Hooks and native Leaflet access support cases beyond the declarative surface.
3. **Useful defaults.** Ship styled controls and icons that work without requiring the consumer to run Tailwind.
4. **Host application fit.** Inherit theme variables and allow custom components instead of imposing website branding on library users.
5. **Typed boundaries.** Keep positions, events, provider results, and public declarations clear enough to catch integration mistakes before runtime.
6. **Recoverable interactions.** Loading, cancellation, failed requests, permission denial, and retry belong to the experience.
7. **Visible evidence.** Demonstrate supported behavior with runnable examples and tests; keep documentation consistent with exports.

## Accessibility & Inclusion

These requirements guide implementation and review; they are not a claim of an accessibility audit or certification.

- Controls MUST support keyboard interaction, visible focus, accessible names, and appropriate native semantics. Icon-only actions MUST have a text alternative.
- Pending, empty, error, permission-denied, and retry states MUST be understandable without relying on color alone. Dynamic feedback MUST be available to assistive technology where appropriate.
- Location permission MUST follow an explicit user action. Users MUST retain a manual selection path when geolocation is unavailable or denied.
- Website navigation, examples, and API content MUST remain usable at mobile widths. Code and table overflow MUST stay within their own containers.
- Motion MUST respect reduced-motion preferences. Host applications MUST be able to style controls for their own contrast and text requirements.

## Offer

ReLeaf provides a reusable library with documentation and live examples. Package publication status, license terms, pricing, paid support, and service guarantees are not established by this document; do not infer a commercial offer or permission to use the code from repository availability alone.

No pricing machine island is included because no verified pricing model is available. Applications select external tile and search providers, whose terms and costs are separate.

## Boundaries

ReLeaf is a React integration for Leaflet, not a tile-hosting, geocoding, routing, or geographic data service. Applications choose their providers and own credentials, business rules, persistence, and backend integrations. Native map access permits plugins without requiring every Leaflet capability to become a first-party control.

React 19.2+ and Leaflet 1.9.4-compatible releases are the current declared peer requirements. Supporting other React versions, mapping engines, or frameworks is outside the current contract. Server rendering supports initial output; the interactive map depends on the browser.

## Decision and quality criteria

Prioritize changes that make a recurring map task simpler, fix an observable integration problem, improve accessibility or recovery, or strengthen an existing public contract. Before adding a control, establish whether composition or a documented native escape hatch already solves the task. A new abstraction should explain its state ownership, customization path, failure behavior, and documentation needs.

Use these as acceptance criteria, not as measured claims:

- A developer can follow setup and render a map without hidden styling or build steps.
- A built-in control can fit a host theme and be replaced or customized without duplicating map logic.
- Prop updates, rerenders, and unmounting do not leave stale callbacks or leaked Leaflet resources.
- Search and location flows remain understandable when requests are slow, cancelled, empty, denied, or unsuccessful.
- Published declarations, API examples, and live demonstrations describe the same behavior.
- Website visitors can reach setup and share API sections on desktop and mobile under the deployed repository path.

Future priorities should be based on demonstrated consumer needs and reproducible gaps. No analytics baseline, adoption target, or dated roadmap is established here.

## Stack

- [AGENTS.md](AGENTS.md): contributor workflow, required checks, and implementation conventions.
- [DESIGN.md](DESIGN.md): library architecture and API design constraints.
- [website/DESIGN.md](website/DESIGN.md): website visual language, structure, and deployment.
- [docs/api.md](docs/api.md): current public API and usage contracts.
- [docs/development.md](docs/development.md): local setup and validation commands.
- [DSL.md](DSL.md): compound API intent and examples.

This document follows the [PRODUCT.md standard](https://product.md/), using canonical sections and a `product` register. Project-specific journey, scope, and decision sections supplement those fields.
