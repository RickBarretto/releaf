# {Re}Leaf

**Interactive React maps. Your components, your controls.**

[![Tests](https://github.com/RickBarretto/releaf/actions/workflows/test.yml/badge.svg)](https://github.com/RickBarretto/releaf/actions/workflows/test.yml)
[![React 19.2+](https://img.shields.io/badge/React-19.2%2B-149eca?logo=react)](https://react.dev/)
[![Leaflet 1.9.4](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)](https://leafletjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-typed-3178c6?logo=typescript&logoColor=white)](src/index.ts)

Build location pickers, searchable maps, and dashboards with typed React
components for Leaflet. Bring your own UI—including shadcn/ui.

## At a Glance

- **Composable:** markers, popups, shapes, GeoJSON, and tile layers.
- **Customizable:** unstyled controls that fit your design system.
- **Interactive:** zoom, rotation, fly-to, and search with your provider.
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
import { Map } from "releaf";

export function CityMap() {
  return (
    <Map.Root style={{ height: 420 }} aria-label="Map of São Paulo">
      <Map.View position={{ latitude: -23.55, longitude: -46.63 }} />
      <Map.Zoom zoom={12} />
      <Map.Tiles.OpenStreetMap />
    </Map.Root>
  );
}
```

## shadcn/ui

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

## Explore

- [API guide](docs/api.md) — components, hooks, search, and shadcn composition.
- [Development guide](docs/development.md) — setup, tests, and Storybook demos.
- [DSL design](DSL.md) — the compound Map API.

Try the demos locally: `bun install` → `bun run storybook` → **http://localhost:6006**.
