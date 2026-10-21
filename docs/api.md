# API reference

[← README](../README.md)

[Setup](#setup) · [Map](#map) · [Camera](#camera) · [Tiles](#tiles) · [Layers](#layers) · [Overlays](#overlays) · [Controls](#controls) · [Search](#search) · [Hooks](#hooks)

## Setup

- Requires React/React DOM **19.2+** and Leaflet **1.9.4**.
- Import `leaflet/dist/leaflet.css` once and give the map a height.
- Use a client component in React Server Component apps.
- Import components, hooks, and public types from `releaf`.
- Place map components and hooks inside `Map.Root` or `MapContainer`. Search can also run outside a map.

Types prefixed with `Leaflet` refer to the `leaflet` package. A **required**
prop must be supplied; other props are optional. Leaflet `options` are
creation-only—change the React `key` to recreate the instance. Dedicated layer
props update the instance and override matching options.

## Map

### `Map.Root` / `MapContainer`

Creates the map and loads Leaflet on the client. Also accepts HTML `div` props.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `initialCenter` | `Leaflet.LatLngExpression` | `[0, 0]`; creation-only center |
| `initialZoom` | `number` | `2`; creation-only zoom |
| `options` | `Leaflet.MapOptions` | Leaflet configuration; `center` and `zoom` override initial props |
| `eventHandlers` | `Leaflet.LeafletEventHandlerFnMap` | Native map event callbacks |
| `ref` | `Ref<Leaflet.Map>` | Access the Leaflet instance |
| `fallback` | `ReactNode` | `null`; content displayed while loading |
| `children` | `ReactNode` | Layers, camera settings, and controls |
| `style` | `CSSProperties` | Includes a default height of `400px` |

```tsx
<Map.Root style={{ height: 420 }} aria-label="City map">…</Map.Root>
```

### Coordinates

| Type | Accepted value |
| --- | --- |
| `Position` | An object with numeric `latitude` and `longitude` fields |
| `PositionExpression` | `Position` or `Leaflet.LatLngExpression` |
| `Leaflet.LatLngExpression` | `[latitude, longitude]`, a Leaflet `LatLng`, or a `{ lat, lng }` object |

Compound `Map` components accept `PositionExpression`. Standalone primitives
accept Leaflet coordinates.

```tsx
<Map.Marker position={{ latitude: -23.55, longitude: -46.63 }} />
```

## Camera

Camera components apply settings when their props change.

| Component | Prop | Type | Required / default |
| --- | --- | --- | --- |
| `Map.View` | `position` | `PositionExpression` | Required |
| | `zoom` | `number` | Current zoom |
| | `animate` | `boolean` | `false` |
| `Map.Zoom` | `zoom` | `number` | Required |
| | `minZoom` | `number` | `0` |
| | `maxZoom` | `number` | `Infinity` |
| `Map.Rotation` | `enabled` | `boolean` | `true`; enables controller rotation |
| | `animate` | `boolean` | `true`; respects reduced motion preferences |
| | `duration` | `number` | `300`; animation duration in milliseconds |
| `MapView` | `center` | `Leaflet.LatLngExpression` | Required |
| | `zoom` | `number` | Required |
| | `animate` | `boolean` | `false` |

```tsx
<Map.View position={home} />
<Map.Zoom zoom={13} minZoom={3} maxZoom={19} />
```

## Tiles

| Component | Description |
| --- | --- |
| `TileLayer` | Renders tiles from a URL template |
| `Map.Tiles.Custom` | Tile layer that also accepts Leaflet tile options directly as props |
| `Map.Tiles.OpenStreetMap` | Preset URL, attribution, and `maxZoom: 19`; no `url` prop |

| Prop | Type | Required / default |
| --- | --- | --- |
| `url` | `string` | Required for `TileLayer` and `Map.Tiles.Custom` |
| `opacity` | `number` | `options.opacity` or `1` |
| `zIndex` | `number` | `options.zIndex` or `1` |
| `options` | `Leaflet.TileLayerOptions` | Creation options |

All tile components accept [shared layer props](#shared-layer-props).
For compound tile components, `options` overrides direct tile options at creation.

```tsx
<Map.Tiles.Custom url={tileUrl} attribution="© Map provider" maxZoom={19} />
```

## Layers

### Shared layer props

| Prop | Type | Purpose |
| --- | --- | --- |
| `options` | Component-specific Leaflet options | Creation configuration |
| `eventHandlers` | `Leaflet.LeafletEventHandlerFnMap` | Native layer event callbacks |
| `ref` | `Ref<T>` | Instance of the corresponding Leaflet layer |
| `children` | `ReactNode` | Nested content, such as popups |
| `pathOptions` | `Leaflet.PathOptions` | Updated styling; available on shapes and `GeoJSON` |

Pass new arrays or objects when changing geometry or styles.

### `Marker` / `Map.Marker`

Places an icon at a coordinate.

| Prop | Type | Required / default |
| --- | --- | --- |
| `position` | `Leaflet.LatLngExpression`; `PositionExpression` for `Map.Marker` | Required |
| `opacity` | `number` | `options.opacity` or `1` |
| `draggable` | `boolean` | `options.draggable` or `false` |
| `zIndexOffset` | `number` | `options.zIndexOffset` or `0` |
| `options` | `Leaflet.MarkerOptions` | Use `icon` for custom marker assets |

### Shapes

All shapes accept shared layer props and `pathOptions`.

| Component | Description | Required props | Optional props | `options` type |
| --- | --- | --- | --- | --- |
| `Polyline` | Lines or multiple lines | `positions`: coordinate array or nested arrays | — | `Leaflet.PolylineOptions` |
| `Polygon` | Polygons, holes, or multipolygons | `positions`: coordinate arrays nested up to three levels | — | `Leaflet.PolylineOptions` |
| `Circle` | Circle measured in meters | `center`: Leaflet coordinate; `radius`: number | — | `Leaflet.CircleMarkerOptions` |
| `CircleMarker` | Circle measured in pixels; no image assets | `center`: Leaflet coordinate | `radius`: number; defaults to `options.radius` or `10` | `Leaflet.CircleMarkerOptions` |
| `Rectangle` | Geographic rectangle | `bounds`: `Leaflet.LatLngBoundsExpression` | — | `Leaflet.PathOptions` |

```tsx
<CircleMarker center={[-23.55, -46.63]} radius={8} pathOptions={{ color: "green" }} />
```

### Groups

Groups own their nested layers. Both accept shared layer props.

| Component | Leaflet instance | `options` type |
| --- | --- | --- |
| `LayerGroup` | `Leaflet.LayerGroup` | `Leaflet.LayerOptions` |
| `FeatureGroup` | `Leaflet.FeatureGroup` | `Leaflet.LayerOptions` |

### `GeoJSON`

Displays geographic features; replaces features when `data` changes.
Accepts shared layer props.

| Prop | Type | Required / purpose |
| --- | --- | --- |
| `data` | First argument accepted by `Leaflet.geoJSON` | Required prop; GeoJSON data or an array of GeoJSON objects |
| `options` | `Leaflet.GeoJSONOptions` | Feature, filter, and styling configuration |
| `pathOptions` | `Leaflet.PathOptions` | Updated feature styling |

### `ImageOverlay`

Places an image within geographic bounds. Accepts shared layer props.

| Prop | Type | Required / default |
| --- | --- | --- |
| `url` | `string` | Required |
| `bounds` | `Leaflet.LatLngBoundsExpression` | Required |
| `opacity` | `number` | `options.opacity` or `1` |
| `zIndex` | `number` | `options.zIndex` or `1` |
| `options` | `Leaflet.ImageOverlayOptions` | Image configuration |

## Overlays

`Popup` and `Tooltip` display React content on a parent layer or at a standalone
position. Use at most one of each per parent layer.

| Prop | Type | Required / purpose |
| --- | --- | --- |
| `children` | `ReactNode` | Overlay content |
| `position` | `Leaflet.LatLngExpression` | Required when standalone |
| `options` | `Leaflet.PopupOptions` or `Leaflet.TooltipOptions` | Creation configuration |
| `open` | `boolean` | Changes open or close the overlay; omit for normal click/hover behavior |

`Map.Popup` and `Map.Tooltip` accept `PositionExpression` for `position`.
Standalone overlays open by default.

```tsx
<Map.Marker position={home}>
  <Map.Popup>Home</Map.Popup>
</Map.Marker>
```

## Controls

### `Map.Toolbar`

Places React UI in a map corner and stops clicks/scrolling reaching the map.
Also accepts HTML `div` props.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `position` | `"topleft"`, `"topright"`, `"bottomleft"`, or `"bottomright"` | `"topright"`; overrides corner flags |
| `top`, `bottom`, `left`, `right` | `boolean` | Corner flags; `bottom` and `left` select their respective edges |
| `children` | `ReactNode` | Controls to display |

### `Map.Actions`

Buttons that invoke map commands. All accept HTML `button` props and optional
`asChild`. A single element child is cloned automatically; `asChild` is unnecessary.
Calling `event.preventDefault()` in a click handler cancels the command.

| Component | Command | Additional props |
| --- | --- | --- |
| `Map.Actions.ZoomIn` | Zoom in one step | — |
| `Map.Actions.ZoomOut` | Zoom out one step | — |
| `Map.Actions.ResetNorth` | Reset bearing to zero | — |
| `Map.Actions.Locate` | Request browser geolocation | `options?: Leaflet.LocateOptions`; defaults to `{ setView: true }` |
| `Map.Actions.FlyTo` | Animate to a location | Required `position: PositionExpression`; optional `zoom: number`, `options: Leaflet.ZoomPanOptions` |

Geolocation requires browser permission and localhost or HTTPS.

```tsx
<Map.Actions.ZoomIn>
  <Button type="button" variant="secondary">Zoom in</Button>
</Map.Actions.ZoomIn>
```

`Button` can be your app's shadcn/ui component; see [README setup](../README.md#shadcnui).

## Search

`Map.SearchBar` / `SearchBar` provides a debounced, keyboard-accessible search
combobox. Supply your own provider and handle selection with `onSelect`.

| Prop | Type | Required / default |
| --- | --- | --- |
| `search` | `(query: string, signal: AbortSignal) => readonly T[]` or a promise of that array | Required |
| `onSelect` | `(place: T) => void` | Required |
| `getLabel` | `(place: T) => string` | Required if results have no `label: string` field |
| `minLength` | `number` | `1` |
| `debounceMs` | `number` | `250` |
| HTML `div` props | Standard React props, except native `onSelect` | Container attributes and children |

The exported `SearchPlace` type has a required `label: string` and optional
`id: string | number`. Other result shapes require `getLabel`.
Pass `signal` to remote fetches for cancellation.

| Child component | Props | Purpose |
| --- | --- | --- |
| `SearchBar.Input` | HTML `input` props; value is managed internally | Search input |
| `SearchBar.Results` | HTML `ul` props and the messages below | Result list |

Both children must be inside `SearchBar`; the same children are available on `Map.SearchBar`.

| Results prop | Type | Default |
| --- | --- | --- |
| `loadingMessage` | `ReactNode` | `"Searching…"` |
| `emptyMessage` | `ReactNode` | `"No results"` |
| `errorMessage` | `ReactNode` | `"Search failed"` |

```tsx
<Map.SearchBar search={searchPlaces} onSelect={selectPlace}>
  <Map.SearchBar.Input placeholder="Find a city" />
  <Map.SearchBar.Results />
</Map.SearchBar>
```

## Hooks

Call map hooks from a component inside `Map.Root` / `MapContainer`.

| Hook | Arguments | Returns | Description |
| --- | --- | --- | --- |
| `useMap` | None | `Leaflet.Map` | Live map instance |
| `useLeaflet` | None | `typeof Leaflet` | Client-loaded module for factories and plugins |
| `useMapView` | None | `MapViewSnapshot` | Camera snapshot updated on `moveend` / `zoomend` |
| `useController` / `Map.useController` | None | Controller below | Navigation commands and native map |
| `useMapEvents` | `handlers: MapEventHandlers` | `Leaflet.Map` | Subscribe to typed map events |

### `MapViewSnapshot`

| Field | Type | Description |
| --- | --- | --- |
| `center` | Readonly `[latitude: number, longitude: number]` | Current center |
| `zoom` | `number` | Current zoom |

The snapshot and its fields are readonly.

### Controller

| Member | Arguments | Returns |
| --- | --- | --- |
| `native` | Property | `Leaflet.Map` |
| `zoomIn`, `zoomOut` | Optional `delta: number` | `Leaflet.Map` |
| `flyTo` | Required `position: PositionExpression`; optional `zoom: number`, `options: Leaflet.ZoomPanOptions` | `Leaflet.Map` |
| `fitBounds` | Required `positions: readonly PositionExpression[]`; optional `options: Leaflet.FitBoundsOptions` | `Leaflet.Map` |
| `rotateBy` | Required `degrees: number`; clockwise, requires `Map.Rotation` | `void` |
| `resetNorth` | None | `void` |

```tsx
const map = Map.useController();
map.flyTo(home, 14);
```

### `MapEventHandlers`

An object keyed by Leaflet event names, using their corresponding callback types.
Geographic events add `position: Position`; other events have optional `position`.
Original Leaflet event fields remain available. Import from `releaf` or `releaf/events`.

```tsx
useMapEvents({ click: (event) => selectPosition(event.position) });
```

Component `eventHandlers` props use native Leaflet event types instead.
For native plugins and controls, create them in an effect and remove them in its cleanup.
