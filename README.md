# {Re}Leaf

**Interactive React maps. Your components, your controls.**

[![Tests](https://github.com/RickBarretto/releaf/actions/workflows/test.yml/badge.svg)](https://github.com/RickBarretto/releaf/actions/workflows/test.yml)
[![React 19.2+](https://img.shields.io/badge/React-19.2%2B-149eca?logo=react)](https://react.dev/)
[![Leaflet 1.9.4](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)](https://leafletjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-typed-3178c6?logo=typescript&logoColor=white)](src/index.ts)

Build location pickers, searchable maps, and dashboards with typed React
components for Leaflet. Built-in controls use shadcn/ui, with support for your own components.

## At a Glance

- **Composable:** markers, popups, shapes, GeoJSON, and tile layers.
- **Customizable:** shadcn/ui controls that fit your design system.
- **Interactive:** zoom, fly-to, and search with your provider.
- **React-ready:** typed hooks, refs, and server rendering support.

## Quick start

Requires React/React DOM **19.2+** and Leaflet **1.9.4**.
Package installation assumes a published or locally linked `releaf` package.

```sh
bun add releaf leaflet react react-dom
```

```tsx
"use client";

import "leaflet/dist/leaflet.css";
import "releaf/styles.css";
import { Map } from "releaf";

export function CityMap() {
  return (
    <Map.Root className="my-map" aria-label="Map of São Paulo">
      <Map.View position={{ latitude: -23.55, longitude: -46.63 }} />
      <Map.Zoom zoom={12} />
      <Map.Tiles.OpenStreetMap />
    </Map.Root>
  );
}
```

## shadcn/ui

The library uses Tailwind CSS v4 utilities, including its attribution footer.
Map actions and search inputs use internal shadcn/ui components. Import
`releaf/styles.css` once for compiled styles; Tailwind is not required in your app.
Customize map sizing with `className`. The quick start uses a custom CSS class:

```css
.my-map {
  height: 24rem;
}
```

Layers, popups, tooltips, toolbars, actions, and search components also accept
`className` strings for CSS styling.

In a Tailwind app, use `className="h-96"` instead. Classes merge with the default
height of 400px, so Tailwind height utilities override it.
Styles omit Tailwind Preflight and inherit your shadcn theme variables, with neutral
fallback colors. You can still supply custom child buttons.

In an [existing shadcn/ui app](https://ui.shadcn.com/docs/installation), add a
[Button](https://ui.shadcn.com/docs/components/button):

```sh
bunx shadcn@latest add button
```

Import your `Button` and place this inside `Map.Root`:

```tsx
import { Button } from "@/components/ui/button";

<Map.Toolbar top right>
  <Map.Actions.ZoomIn>
    <Button type="button" variant="secondary">Zoom in</Button>
  </Map.Actions.ZoomIn>
</Map.Toolbar>
```

Your button supplies the style; ReLeaf supplies the map action. No `asChild` needed.

## Request the user's location

Create the request in a click handler and keep its promise in state.
`useCurrentLocation` reads that promise using React's Suspense API. Location
permission is requested only after the click. Use HTTPS or localhost.

```tsx
import { Suspense, useState } from "react";
import { Map, requestCurrentLocation, useCurrentLocation, type Position } from "releaf";

function UserLocation({ request }: { request: Promise<Position> }) {
  const position = useCurrentLocation(request);
  return (
    <>
      <Map.View position={position} zoom={16} />
      <Map.Marker position={position} />
    </>
  );
}

export function LocationMap() {
  const [request, setRequest] = useState<Promise<Position> | null>(null);
  return (
    <Map.Root>
      <Map.View position={{ latitude: 51.5074, longitude: -0.1278 }} />
      <Map.Zoom zoom={13} />
      <Map.Tiles.OpenStreetMap />
      <Map.Toolbar top left>
        <button type="button" onClick={() => setRequest(requestCurrentLocation())}>
          Use my current location
        </button>
      </Map.Toolbar>
      <Suspense fallback={<Map.Toolbar bottom left>Requesting location…</Map.Toolbar>}>
        {request && <UserLocation request={request} />}
      </Suspense>
    </Map.Root>
  );
}
```

Wrap this example in your application's error boundary to handle denied
permission, timeouts, or unavailable geolocation. `requestCurrentLocation`
accepts browser `PositionOptions` and defaults to a ten-second timeout.
See **Map / DSL / Current Location** in Storybook for a complete example
with error feedback and retry.

## Explore

- **Map / Location Picker / Complete** in Storybook combines search, current
  location with retry, a draggable marker, map clicks, and selected coordinates.
  [Example source](stories/examples/LocationPicker.tsx) · [composition notes](docs/location-picker.md).
- [API guide](docs/api.md) — components, hooks, search, and shadcn composition.
- [Development guide](docs/development.md) — setup, tests, and Storybook demos.
- [DSL design](DSL.md) — the compound Map API.

Try the demos locally: `bun install` → `bun run storybook` → **http://localhost:6006**.
