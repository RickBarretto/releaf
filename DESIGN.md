# Library design

This document describes ReLeaf's library architecture and the constraints to preserve when extending it. Product intent lives in [PRODUCT.md](PRODUCT.md); the website has its own [design document](website/DESIGN.md). Exact signatures belong in [docs/api.md](docs/api.md) and exported TypeScript types.

## API model

ReLeaf makes Leaflet usable through React composition. A small map can declare a root, camera, tile source, and markers; a richer application can add search, location selection, or its own controls without replacing that foundation.

The API has three related layers:

1. Low-level exports such as `MapContainer`, `MapView`, layers, overlays, and hooks expose Leaflet-oriented capabilities.
2. The compound `Map` namespace supplies readable composition: `Map.Root`, `Map.View`, `Map.Zoom`, `Map.Tiles`, `Map.Marker`, `Map.Toolbar`, and `Map.Actions`.
3. Composed controls such as navigation, search, coordinates, layer switching, and the location picker combine primitives for common tasks.

Implement behavior in the owning primitive or shared helper, then compose it into higher-level controls. Avoid separate implementations of the same map operation. `useMap`, `useLeaflet`, refs, and the controller's native map access provide escape hatches for Leaflet plugins and imperative work.

Named positions use `{ latitude, longitude }`; supported coordinate expressions are normalized at the DSL boundary. Keep coordinate conversion explicit to avoid latitude/longitude order mistakes.

## Runtime ownership

`MapContainer` owns the DOM container, dynamically loaded Leaflet module, map instance, resize observer, and teardown. Its initial camera and options are creation-only; changing the React key recreates the map. Subsequent camera changes belong to `MapView` or the camera/action components.

The root renders a fallback until Leaflet is ready, then provides map context to descendants. Runtime initialization failures reach the application's error boundary. Package imports and server rendering must remain safe without browser globals; an interactive map still initializes in the browser.

Map context holds both the live map and the browser-loaded Leaflet module. Layer context identifies the parent layer for overlays; layer-container context routes children into groups. Components must attach resources to the correct owner and remove them on unmount or replacement. Popup and tooltip content remains React-owned while being displayed in Leaflet containers.

Update mutable Leaflet properties in place where supported. Recreate objects only when their creation contract requires it. Effects must handle cancellation, unmounting during asynchronous setup, and React Strict Mode without leaking maps, layers, listeners, or observers.

## State and events

React props describe desired state; Leaflet owns its interactive runtime. Event callbacks report user changes back to the application. Preserve each component's documented controlled and uncontrolled behavior rather than silently turning initial values into continuously controlled values.

Shared event subscriptions track event names and dispatch to the latest committed callback. Callback identity changes should not cause needless listener churn. `useMapView` exposes settled camera changes through `useSyncExternalStore` and caches snapshots until values change.

Search is a standalone, generic compound primitive that does not require a map. It owns query, active result, selection, pending/error states, debounce, and cancellation. Applications supply the provider. Abort requests on query changes and unmount; ignore obsolete responses even when providers ignore cancellation. Higher-level map search adds camera and selection behavior.

Geolocation separates requesting a browser position from reading the result. The promise-based API integrates with Suspense; composed controls provide their own request feedback. Permission requests belong to explicit interaction. Failure and retry are part of the interaction contract.

## UI and styling

Built-in controls use internal shadcn/ui primitives, Radix behavior, and Tailwind v4 utilities. The published `releaf/styles.css` is compiled so consumers do not need Tailwind. It excludes Preflight to avoid resetting host applications and uses scoped baselines with inherited shadcn theme variables and neutral fallbacks.

`className` supports local overrides, including map height; the default map height is 400px. Keep library styling neutral so host applications determine visual identity. Website colors and typography belong in `website/`, not the package stylesheet.

Actions can wrap custom child buttons without an `asChild` requirement. Preserve native button semantics, consumer event handling, disabled behavior, keyboard interaction, and accessible names. `IconProvider` supplies replaceable icon slots with Lucide defaults; omitted slots retain defaults and `null` hides a slot.

Map attribution is a functional part of the map. The footer tracks active tile-provider credits. Custom placement or prefixes must retain those credits; preserve the existing `Map.Attributtion` compatibility alias alongside `Map.Attribution`.

## Distribution and verification

The package publishes `dist/` with ESM, declarations, the `releaf/events` subpath, and compiled CSS. Bun builds JavaScript with a client directive, TypeScript emits declarations, and `tools/build-styles.ts` builds CSS. React, React DOM, and Leaflet are peer dependencies; current declared support is React 19.2+ and Leaflet 1.9.4-compatible releases.

Verify contracts at the boundary they affect: integration tests exercise real Leaflet in jsdom, consumer fixtures check published types, server/import checks protect browser isolation, and Playwright exercises actual map interactions across three engines. Storybook demonstrates composition and customization. Public changes should keep these examples, exports, and the API guide aligned.
