# {Re}Leaf

A small, typed React wrapper for Leaflet. React 19.2+, React DOM 19.2+, and
Leaflet 1.9.4 are peers. Bun handles the build and tests; no React wrapper,
state library, or bundler dependency is required.

## Usage

```sh
bun add releaf leaflet react react-dom
```

Import Leaflet's CSS once in your application. Give the map a height. The
wrapper defaults to 400px and automatically observes container resizes.

```tsx
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "releaf";

export function CityMap() {
  return (
    <MapContainer
      initialCenter={[-23.55, -46.63]}
      initialZoom={12}
      style={{ height: 480 }}
      aria-label="Map of São Paulo"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        options={{
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }}
      />
      <CircleMarker center={[-23.55, -46.63]} radius={8}>
        <Popup><strong>São Paulo</strong></Popup>
      </CircleMarker>
    </MapContainer>
  );
}
```

The package is not published by this scaffold; the install command applies
after publishing or linking it into your application.

## Components

| Component | Mutable props |
| --- | --- |
| `MapContainer` | DOM attributes, style, children, eventHandlers, ref |
| `MapView` | center, zoom, animate |
| `TileLayer` | url, opacity, zIndex |
| `Marker` | position, opacity, draggable, zIndexOffset |
| `Polyline`, `Polygon` | positions, pathOptions |
| `Circle` | center, radius (meters), pathOptions |
| `CircleMarker` | center, radius (pixels), pathOptions |
| `Rectangle` | bounds, pathOptions |
| `ImageOverlay` | url, bounds, opacity, zIndex |
| `LayerGroup`, `FeatureGroup` | children |
| `GeoJSON` | data, pathOptions |
| `Popup`, `Tooltip` | children, position, open |

Layers accept Leaflet `options`, `eventHandlers`, and a React 19 `ref` exposing
their Leaflet instance. Maps accept `initialCenter`, `initialZoom`, and Leaflet
map `options`. These initial values and all `options` objects are creation-only;
use the dedicated props for updates or change `key` to recreate an instance.
An explicit mutable prop takes precedence over its initial option value.

`LayerGroup` and `FeatureGroup` own their nested layers, including removal from
the group when a child unmounts. `GeoJSON` replaces its features when `data`
identity changes, so memoize large datasets. Geometry arrays and option objects
should be treated as immutable.

`MapView` applies camera changes when its values change; it lets users pan and
zoom between changes. It does not lock the map to a fixed camera.

```tsx
import { MapView } from "releaf";

// Place inside MapContainer to move an existing map.
<MapView center={[-22.91, -43.17]} zoom={13} animate />;
```

## Hooks and plugins

Hooks must run in a descendant of `MapContainer`. Descendants mount after the
map is ready, so `useMap()` always returns a live instance.

```tsx
import { useMapEvents, useMapView } from "releaf";

function MapStatus() {
  const { center, zoom } = useMapView();
  useMapEvents({
    click(event) { console.log(event.latlng); },
  });
  return <output>Zoom {zoom}: {center.join(", ")}</output>;
}
```

- `useMap()` exposes the map for controls, plugins, bounds fitting, and other
  Leaflet APIs. Create integrations in an effect and remove them in its cleanup.
- `useLeaflet()` exposes the loaded Leaflet module, including icon factories.
- `useMapEvents(handlers)` attaches typed map events. Callbacks see current props
  and state through `useEffectEvent`, without resubscribing when only callbacks change.
- `useMapView()` subscribes to `moveend` and `zoomend` through
  `useSyncExternalStore`, returning a cached, immutable `{ center, zoom }` snapshot.

## Popups, tooltips, and icons

Nest `Popup` or `Tooltip` inside a marker or vector layer to bind it. For a
standalone overlay, provide `position`. Omit `open` for Leaflet's normal click
or hover behavior; set it to open or close the overlay when the prop changes.
Keep one popup and one tooltip per parent layer.

Overlay children render through React portals, preserving context, state, and
event handlers. React escapes text as usual. Leaflet string options such as
attribution and icon HTML follow Leaflet's own HTML behavior.

Standard `Marker` uses Leaflet's default icon images. Configure `options.icon`
with your own bundled image URLs if your bundler does not resolve Leaflet's
default assets. `CircleMarker` needs no image assets.

## Rendering and lifecycle

The ESM entry preserves `"use client"` for React Server Component frameworks.
Leaflet is dynamically imported in an effect, so importing the library and
server-rendering the map container require no browser globals. The initial
client render matches the server; `fallback` displays while Leaflet loads.
Load or creation errors reach the nearest React error boundary.

Maps, layers, subscriptions, overlays, and resize observers clean up on unmount
and tolerate Strict Mode's setup/cleanup replay. Map children are rendered next
to Leaflet's managed DOM to keep React and Leaflet DOM ownership separate.

## Development

```sh
bun install
bun run typecheck
bun run test
bun run build
```

Tests exercise the published ESM bundle against real Leaflet in jsdom, plus
server rendering in fresh processes. Consumer type fixtures check the emitted
declarations through `releaf` and `releaf/events`, including expected errors.

```sh
bun run test                 # Build and run Bun/jsdom integration tests
bun run test:types           # Build and check test code and consumer types
bunx playwright install --with-deps chromium firefox webkit
bun run test:browser         # Build and run all three browser engines
bun run test:browser --project=chromium
bun run test:all             # Source types, integration, test types, browsers
```

Browser tests start a dedicated Vite fixture on `127.0.0.1:4173`, import the
built package, and use local SVG tiles and local Leaflet marker images. They
cover gestures, portals, search, resize, rotation, remounting, and SSR hydration.
No tile provider or geocoding service is contacted. Browser binaries must be
installed once; Linux may also require the system dependencies installed by
`--with-deps`. Playwright keeps screenshots and traces for failures in
`test-results/`; inspect a trace with `bunx playwright show-trace <trace.zip>`.
Mobile touch gestures and external provider integration remain consuming-app
checks.

GitHub Actions runs integration tests, type checks, lint, and separate Chromium,
Firefox, and WebKit jobs on pushes and pull requests. Dependency versions are
recorded in `bun.lock`; CI installs with `bun install --frozen-lockfile`.

The build emits an ESM bundle and `.d.ts` files in `dist/`, keeping peers external.
`@types/leaflet` is the only direct dependency so consumers receive the Leaflet
types used by the public API. No runtime implementation is bundled from peers.

Before publishing, choose an available package name and license, and inspect
`bun publish --dry-run`. Publishing rebuilds and checks the source types.

## References

- [Leaflet stable release](https://leafletjs.com/download.html)
- [Leaflet API](https://leafletjs.com/reference.html)
- [React effects](https://react.dev/reference/react/useEffect)
- [React effect events](https://react.dev/reference/react/useEffectEvent)
- [React external stores](https://react.dev/reference/react/useSyncExternalStore)

## Compound DSL

The `Map` namespace composes the same primitives with declarative camera settings,
Leaflet controls, and unstyled actions:

```tsx
import { Map, type Position } from "releaf";

const home: Position = { latitude: 51.5074, longitude: -0.1278 };

function Example() {
  return (
    <Map.Root style={{ height: 500 }}>
      <Map.View position={home} />
      <Map.Zoom zoom={13} minZoom={3} maxZoom={19} />
      <Map.Rotation enabled />
      <Map.Tiles.OpenStreetMap />
      <Map.Marker position={home}><Map.Popup>Home</Map.Popup></Map.Marker>
      <Map.Toolbar top right>
        <Map.Actions.ZoomIn />
        <Map.Actions.ZoomOut />
        <Map.Actions.ResetNorth />
        <Map.Actions.FlyTo position={home} zoom={14}>
          <button>Go home</button>
        </Map.Actions.FlyTo>
      </Map.Toolbar>
    </Map.Root>
  );
}
```

`Map.useController()` exposes `zoomIn`, `zoomOut`, `flyTo`, `fitBounds`,
`rotateBy`, `resetNorth`, and the native Leaflet map as `native`. Rotation is
clockwise in degrees and enabled by `Map.Rotation`. Toolbars accept corner
flags or a Leaflet `position` such as `"bottomleft"`. Their contents retain
React context and do not propagate clicks or scrolling to the map. Actions
render buttons by default; a supplied element is cloned so custom buttons
keep their own handlers. Calling `preventDefault()` cancels the map action.

`Map.Tiles.Custom` accepts `url`, direct Leaflet tile options such as
`attribution` and `maxZoom`, and the existing `options` escape hatch. Tile
options are creation-only; change `key` to recreate a layer.

Import `useMapEvents` from `releaf/events` (or `releaf`) to receive Leaflet
events with `event.position.latitude` and `event.position.longitude` on
geographic events. Existing Leaflet event fields remain available.

Search accepts your own provider; no geocoding service is bundled:

```tsx
<Map.SearchBar search={searchPlaces} onSelect={setDeliveryAddress}>
  <Map.SearchBar.Input placeholder="Delivery address" />
  <Map.SearchBar.Results />
</Map.SearchBar>
```

Providers return an array or promise of places with a `label` field. Supply
`getLabel` for other result shapes. The provider receives `(query, signal)`
for cancellation. Searches debounce by 250ms by default (`debounceMs`), ignore
stale responses, and support arrow keys, Enter, and Escape. Customize status
text with `loadingMessage`, `emptyMessage`, and `errorMessage` on `Results`.
Search may be placed in a toolbar or used outside the map.

## Storybook development

```sh
bun install
bun run storybook
```

Open **http://localhost:6006**. Storybook imports the library source directly,
so edits to `src/` refresh the examples without rebuilding `dist/`.

Under **Map → DSL**, try:

- **Navigation Playground** — zoom, rotate, reset north, fly home, locate, and fit markers; use Controls to change the initial zoom and enable rotation.
- **Coordinate Picker** — click to select coordinates and copy them.
- **Layer Switcher** — switch between OpenStreetMap and OpenTopoMap.
- **Action Components** — compose `Map.Actions` with custom buttons.
- **Search Places** — search local sample cities and fly to the selected result.
- **Offline Preview** — a locally generated grid for trying the map without a tile service.

Online basemaps need internet access. Geolocation requires browser permission;
clipboard and geolocation work on localhost or HTTPS. Search uses local demo
data and does not call a geocoding service.

The examples use a local [shadcn/ui](https://ui.shadcn.com/docs/installation/manual)
Button in `stories/components/ui/`, Tailwind CSS v4, and Lucide icons. All UI
dependencies are development dependencies; the published package still contains
only `dist/`. `components.json` points future shadcn additions at the stories
folder, using the `@/` alias.

```sh
bun run build-storybook       # Generate storybook-static/
bun run typecheck:stories     # Check examples and Storybook configuration
bun run lint                 # Check library, stories, and configuration
```

Storybook uses the [React + Vite framework](https://storybook.js.org/docs/get-started/frameworks/react-vite).
