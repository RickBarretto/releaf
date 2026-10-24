# API reference

[← README](../README.md)

Use the component sections for props and examples. Use the hook sections when
you need to implement your own controls.

## Contents

- [Setup](#setup)
- [Map and coordinates](#map)
- [Attribution](#mapattribution)
- [Camera](#camera)
- [Tiles](#tiles)
- [Layers](#layers)
- [Popups and tooltips](#overlays)
- [Toolbars and actions](#controls)
- [Ready-made controls](#composed-controls)
- [Location picker](#location-picker)
- [Search](#search)
- [Geolocation](#geolocation)
- [Map hooks](#hooks)
- [Icons](#icons)

## Setup

### Requirements

| Dependency | Version |
| --- | --- |
| React / React DOM | 19.2+ |
| Leaflet | 1.9.4 |

### Imports and sizing

```tsx
"use client";

import "leaflet/dist/leaflet.css";
import "releaf/styles.css";
import { Map, type Position } from "releaf";

const home: Position = { latitude: 51.5074, longitude: -0.1278 };

export function CityMap() {
  return (
    <Map.Root className="city-map" aria-label="City map">
      <Map.View position={home} zoom={13} />
      <Map.Tiles.OpenStreetMap />
    </Map.Root>
  );
}
```

```css
.city-map {
  height: 24rem;
}
```

- Use a client component in React Server Component apps.
- Compiled styles are included; consumers do not need Tailwind.
- In a Tailwind app, a height utility such as `h-96` can replace the custom class.
- Examples below use `home` from the setup example where a starting position is needed.

### Placement

| API | Required parent |
| --- | --- |
| Map layers, camera components, toolbars, and map-aware controls | `Map.Root` or `MapContainer` |
| `SearchBar` / `Map.SearchBar` | No map required |
| `useLocationRequest`, `requestCurrentLocation`, `useCurrentLocation` | No map required |
| `useLocationPicker` and picker child components | `Map.LocationPicker` inside a map |

### Reading prop tables

- **Required** means the caller must supply a value.
- `Leaflet.*` types come from the `leaflet` package.
- Leaflet `options` are creation-only. Change the component's React `key` to recreate the instance.
- Dedicated layer props update the live instance and override matching creation options.

## Map

### `Map.Root` / `MapContainer`

Creates the map and loads Leaflet on the client. Also accepts HTML `div` props, including `className?: string`, except `style`.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `initialCenter` | `Leaflet.LatLngExpression` | `[0, 0]`; creation-only center |
| `initialZoom` | `number` | `2`; creation-only zoom |
| `options` | `Leaflet.MapOptions` | Leaflet configuration; `center` and `zoom` override initial props |
| `eventHandlers` | `Leaflet.LeafletEventHandlerFnMap` | Native map event callbacks |
| `ref` | `Ref<Leaflet.Map>` | Access the Leaflet instance |
| `fallback` | `ReactNode` | `null`; content displayed while loading |
| `children` | `ReactNode` | Layers, camera settings, and controls |
| `className` | `string` | CSS classes merged with the default height of `400px` |

```tsx
<Map.Root className="h-96" aria-label="City map">…</Map.Root>
```

Use Tailwind utilities such as `h-96` in a Tailwind app, or pass a custom CSS
class with a height rule (for example, `.city-map { height: 24rem; }`).
`className` merges with the defaults using the same class-merging utility as
shadcn/ui. The `style` prop is not supported.

### `Map.Attribution`

Every map includes a themed attribution footer by default. Add this component
inside `Map.Root` or `MapContainer` to customize that footer. Tile-provider credits
stay visible and update as layers change. Removing the component restores the default.
`Map.Attributtion` is an alias; `MapAttribution` and `MapAttributionProps` are also exported.

```tsx
<Map.Root>
  <Map.Tiles.OpenStreetMap />
  <Map.Attribution bottom left prefix="My map" />
</Map.Root>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `top` | `boolean` | `false` | Place the footer at the top. |
| `bottom` | `boolean` | Bottom when `top` is omitted | Place the footer at the bottom; wins when both vertical flags are true. |
| `left` | `boolean` | `false` | Place the footer on the left; wins when both horizontal flags are true. |
| `right` | `boolean` | Right when `left` is omitted | Place the footer on the right. |
| `prefix` | `string \| false` | Releaf and Leaflet links | Leaflet HTML prefix; `false` hides only the prefix. |
| `className` | `string` | — | Additional footer classes. |

Placement uses boolean props: `<Map.Attribution top right />`, for example.
With no flags, placement is bottom right. There is no `position` prop.
If multiple attribution components are mounted, the last registered one takes precedence.

### Coordinates

| Type | Accepted value |
| --- | --- |
| `Position` | An object with numeric `latitude` and `longitude` fields |
| `PositionExpression` | `Position` or `Leaflet.LatLngExpression` |
| `Leaflet.LatLngExpression` | `[latitude, longitude]`, a Leaflet `LatLng`, or a `{ lat, lng }` object |

Compound camera, marker, overlay, and action components accept `PositionExpression`.
Standalone layer primitives accept Leaflet coordinates. Picker values and coordinate
displays use named `Position` objects.

```tsx
<Map.Marker position={{ latitude: -23.55, longitude: -46.63 }} />
```

## Camera

Camera components apply settings when their props change. User pan and zoom
remain free between updates.

### `Map.View`

Set the center using named coordinates or a Leaflet coordinate.

| Prop | Type | Default |
| --- | --- | --- |
| `position` | `PositionExpression` | Required |
| `zoom` | `number` | Current zoom |
| `animate` | `boolean` | `true`; respects reduced motion |

```tsx
<Map.View position={home} zoom={13} animate={false} />
```

### `Map.Zoom`

Set the zoom level and optional limits.

| Prop | Type | Default |
| --- | --- | --- |
| `zoom` | `number` | Required |
| `minZoom` | `number` | `0` |
| `maxZoom` | `number` | `Infinity` |

```tsx
<Map.Zoom zoom={13} minZoom={3} maxZoom={19} />
```

### `MapView`

Standalone camera component using Leaflet coordinates.

| Prop | Type | Default |
| --- | --- | --- |
| `center` | `Leaflet.LatLngExpression` | Required |
| `zoom` | `number` | Required |
| `animate` | `boolean` | `true`; respects reduced motion |

```tsx
<MapView center={[51.5074, -0.1278]} zoom={13} />
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
| `className` | `string` | Mutable CSS classes on rendered layer elements; groups apply classes to descendants |
| `pathOptions` | `Leaflet.PathOptions` | Updated styling; available on shapes and `GeoJSON` |

Use `className` for CSS styling. Shapes and GeoJSON retain `pathOptions` for
Leaflet rendering options, including Canvas rendering where no DOM path exists.
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

All shapes accept [shared layer props](#shared-layer-props) and `pathOptions`.

| Component | Required geometry | Measurement |
| --- | --- | --- |
| `Polyline` | `positions` | Line or multiple lines |
| `Polygon` | `positions` | Polygon, holes, or multipolygons |
| `Circle` | `center`, `radius` | Radius in meters |
| `CircleMarker` | `center` | Radius in pixels |
| `Rectangle` | `bounds` | Geographic rectangle |

**Geometry types**

- `center`: `Leaflet.LatLngExpression`.
- `positions`: Leaflet coordinate arrays, nested for multiple lines or polygon rings.
- `bounds`: `Leaflet.LatLngBoundsExpression`.
- `radius`: `number`. For `CircleMarker`, defaults to `options.radius` or `10`.

**Creation options**

| Component | `options` type |
| --- | --- |
| `Polyline`, `Polygon` | `Leaflet.PolylineOptions` |
| `Circle`, `CircleMarker` | `Leaflet.CircleMarkerOptions` |
| `Rectangle` | `Leaflet.PathOptions` |

```tsx
<CircleMarker
  center={[-23.55, -46.63]}
  radius={8}
  pathOptions={{ color: "green" }}
/>
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
| `className` | `string` | Mutable CSS classes on the React content container |
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
Also accepts HTML `div` props, including `className?: string`, except `style`.

| Prop | Type | Default / purpose |
| --- | --- | --- |
| `position` | `"topleft"`, `"topright"`, `"bottomleft"`, or `"bottomright"` | `"topright"`; overrides corner flags |
| `top`, `bottom`, `left`, `right` | `boolean` | Corner flags; `bottom` and `left` select their respective edges |
| `children` | `ReactNode` | Controls to display |

### `Map.Actions`

Buttons that invoke map commands. Use them alone or wrap your own button.

| Component | Command | Default appearance |
| --- | --- | --- |
| `Map.Actions.ZoomIn` | Zoom in one step | Ghost icon button |
| `Map.Actions.ZoomOut` | Zoom out one step | Ghost icon button |
| `Map.Actions.Locate` | Request browser geolocation | Text button |
| `Map.Actions.FlyTo` | Animate to a location | Text button |
| `Map.Actions.FitBounds` | Fit a set of positions | Text button |

#### Shared props and composition

| Prop | Type | Purpose |
| --- | --- | --- |
| HTML button props | React button attributes, except `style` | Labels, classes, click handlers, disabled state |
| `asChild` | `boolean` | Optional explicit child composition |
| `children` | `ReactNode` | Button content or a custom button element |

- A single element child is composed automatically; `asChild` is optional.
- Calling `event.preventDefault()` in a click handler cancels the command.
- Zoom actions disable at the map's minimum and maximum zoom levels.

```tsx
<Map.Actions.ZoomIn>
  <Button type="button" variant="ghost" size="icon" aria-label="Zoom in">
    <Plus />
  </Button>
</Map.Actions.ZoomIn>
```

`Button` and `Plus` above come from your app's UI and icon libraries.
See [shadcn composition](../README.md#shadcnui).

#### `Map.Actions.Locate`

| Prop | Type | Default |
| --- | --- | --- |
| `options` | `Leaflet.LocateOptions` | `{ setView: true }` |

This action delegates to Leaflet's location API. For built-in pending, error,
and retry feedback, use [Map.LocationControl](#maplocationcontrol).

#### `Map.Actions.FlyTo`

| Prop | Type | Default |
| --- | --- | --- |
| `position` | `PositionExpression` | Required |
| `zoom` | `number` | Current zoom |
| `options` | `Leaflet.ZoomPanOptions` | Leaflet defaults |

```tsx
<Map.Actions.FlyTo position={home} zoom={14} />
```

#### `Map.Actions.FitBounds`

| Prop | Type | Default |
| --- | --- | --- |
| `positions` | `readonly PositionExpression[]` | Required |
| `options` | `Leaflet.FitBoundsOptions` | Leaflet defaults |

- Empty positions disable the action.
- Fly-to and fit-bounds actions respect reduced motion preferences.

```tsx
<Map.Actions.FitBounds
  positions={[home, { latitude: 51.515, longitude: -0.09 }]}
  options={{ padding: [50, 50] }}
/>
```

## Composed controls

Ready-made controls include default styling. Add only the controls your map needs.

| Need | Component | Placement |
| --- | --- | --- |
| Navigation toolbox | [Map.Navigation](#mapnavigation) | Creates its own toolbar |
| Current location with retry | [Map.LocationControl](#maplocationcontrol) | Place inside a toolbar |
| Coordinate display and copy | [Map.Coordinates](#mapcoordinates) | Place inside a toolbar |
| Switch tile layers | [Map.LayerSwitcher](#maplayerswitcher) | Place inside a toolbar |
| Search and move the map | [Map.Search](#mapsearch) | Place inside a toolbar |
| Combined location selection | [Map.LocationPicker](#location-picker) | Creates default controls or accepts a custom layout |

**Shared conventions**

- Place these components inside `Map.Root` or `MapContainer`.
- Import `releaf/styles.css` for their default appearance.
- Use `className` and your shadcn theme variables to customize styling.
- Standalone exports `Navigation`, `LocationControl`, `Coordinates`,
  `LayerSwitcher`, `MapSearch`, and `LocationPicker` provide the same behavior.

### `Map.Navigation`

A toolbox of consistently sized icon buttons.

```tsx
<Map.Root options={{ zoomControl: false }}>
  <Map.Tiles.OpenStreetMap />
  <Map.Navigation home={home} zoom={14} locate />
</Map.Root>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `orientation` | `"vertical"` or `"horizontal"` | `"vertical"` |
| `home` | `PositionExpression` | No home action |
| `zoom` | `number` | Home keeps current zoom; locate uses `16` |
| `locate` | `boolean` | `false` |
| `positions` | `readonly PositionExpression[]` | No fit-bounds action |
| `fitOptions` | `Leaflet.FitBoundsOptions` | Leaflet defaults |
| `children` | `ReactNode` | Built-in action set |

[Toolbar position props](#maptoolbar) also apply. `className` styles the toolbox panel.

#### Behavior

- Zoom actions are always included in the default action set.
- `home`, `locate`, and `positions` enable their corresponding actions.
- Location feedback appears at the lower left, keeping the toolbox size fixed.
- Supplying children replaces the default actions.
- Disable Leaflet's native zoom control to avoid duplicate zoom buttons.

### `Map.LocationControl`

A user-triggered location request with pending, error, and retry feedback.

```tsx
<Map.Toolbar top left>
  <Map.LocationControl zoom={16} onSuccess={handlePosition} />
</Map.Toolbar>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `options` | Browser `PositionOptions` | Ten-second timeout when omitted |
| `compact` | `boolean` | `false` |
| `recenter` | `boolean` | `true` |
| `zoom` | `number` | `16` |
| `onSuccess` | `(position: Position) => void` | — |
| `onError` | `(error: Error) => void` | — |

HTML `div` props are supported except `style` and native `onError`.

#### Display modes

| Mode | Button | Feedback |
| --- | --- | --- |
| Default | Secondary button with label and icon | Inline |
| `compact` | Ghost icon button | Separate panel at the lower left |

Permission is requested only after a click. Geolocation requires HTTPS or localhost.

### `Map.Coordinates`

Display a position and optionally copy its formatted coordinates.

```tsx
<Map.Toolbar bottom left>
  <Map.Coordinates position={selected} precision={5} />
</Map.Toolbar>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `position` | `Position` or `null` | Required |
| `precision` | `number` | `5` decimal places |
| `format` | `(position: Position) => string` | Latitude and longitude separated by a comma |
| `copy` | `boolean` | `true` |
| `children` | `ReactNode` | No additional content |

HTML `section` props are supported except `style`.

#### Behavior

- A null position displays “No location selected” and disables copying.
- `format` overrides the default decimal formatting.
- Copy uses the displayed text and announces success or clipboard failure.
- Children appear above the coordinate output inside the same panel.

### `Map.LayerSwitcher`

Switch between configured layers while preserving the map and camera.

```tsx
<Map.Toolbar top left>
  <Map.LayerSwitcher defaultValue="streets">
    <Map.LayerSwitcher.Item value="streets" label="Streets">
      <Map.Tiles.OpenStreetMap />
    </Map.LayerSwitcher.Item>
    <Map.LayerSwitcher.Item value="custom" label="Custom">
      <Map.Tiles.Custom url={tileUrl} attribution="© Map provider" />
    </Map.LayerSwitcher.Item>
  </Map.LayerSwitcher>
</Map.Toolbar>
```

#### Root props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` | Uncontrolled |
| `defaultValue` | `string` | First item's value |
| `onValueChange` | `(value: string) => void` | — |
| `children` | `ReactNode` | Supply `Item` children |

HTML `div` props are supported except `style`, native `defaultValue`, and `onChange`.

#### `Map.LayerSwitcher.Item` props

| Prop | Type | Requirement |
| --- | --- | --- |
| `value` | `string` | Required; unique within the switcher |
| `label` | `ReactNode` | Required |
| `children` | `ReactNode` | Required; the item's layers |

Only the active item's layers mount. Use `value` with `onValueChange` for
controlled selection, or `defaultValue` for internal state.

### `Map.Search`

Search with your provider, move the map, and show the selected marker.

```tsx
<Map.Toolbar top left>
  <Map.Search
    search={searchPlaces}
    getPosition={(place) => place.position}
    placeholder="Find a city"
    zoom={13}
  />
</Map.Toolbar>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `search` | [Search provider](#search-provider) | Required |
| `getPosition` | `(result: T) => Position` | Required |
| `getLabel` | `(result: T) => string` | Uses `result.label`; required for other result shapes |
| `onSelect` | `(result: T) => void` | — |
| `zoom` | `number` | `13` |
| `marker` | `boolean` | `true` |
| `placeholder` | `string` | `"Find a location"` |
| `minLength` | `number` | `1` |
| `debounceMs` | `number` | `250` |
| `children` | `ReactNode` | Styled input and results |

- Selecting a result moves the camera and calls `onSelect`.
- Set `marker={false}` to manage the marker yourself.
- Supply `Map.SearchBar.Input` and `.Results` children to replace the default presentation.

## Location picker

Combine map clicks, marker dragging, search, and current location into one selection.

### Basic usage

```tsx
<Map.Root initialCenter={[51.5, -0.12]} initialZoom={13}>
  <Map.Tiles.OpenStreetMap />
  <Map.LocationPicker defaultValue={home} />
</Map.Root>
```

The picker uses its existing map and tile provider.

### Root props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `Position` or `null` | Uncontrolled |
| `defaultValue` | `Position` or `null` | `null` |
| `onValueChange` | `(value, details) => void` | —; signature below |
| `zoom` | `number` | `13` |
| `locationOptions` | Browser `PositionOptions` | Ten-second timeout when omitted |
| `children` | `ReactNode` | Default marker and controls |

```ts
onValueChange?: (
  value: Position | null,
  details: SelectionDetails,
) => void;

interface SelectionDetails {
  source: SelectionSource;
}
```

### Controlled or uncontrolled

| Mode | Props | Who owns selection? |
| --- | --- | --- |
| Uncontrolled | `defaultValue` | Picker |
| Controlled | `value` and `onValueChange` | Parent component |

```tsx
const [position, setPosition] = useState<Position | null>(null);

<Map.LocationPicker value={position} onValueChange={setPosition} />
```

A controlled value remains authoritative, including when the parent declines a change.

### Default layout

| Part | Location |
| --- | --- |
| Draggable marker | Selected position; absent when selection is null |
| Current-location button and feedback | Top left |
| Source, coordinate output, and copy button | Bottom left |

Search is opt-in and needs your provider.

### Custom layout

Supplying children replaces the default layout. Include each part you want to use.

```tsx
<Map.LocationPicker defaultValue={home}>
  <Map.LocationPicker.Marker />

  <Map.Toolbar top left>
    <Map.LocationPicker.Search
      search={searchPlaces}
      getPosition={(place) => place.position}
    />
    <Map.LocationPicker.Locate />
  </Map.Toolbar>

  <Map.Toolbar bottom left>
    <Map.LocationPicker.Coordinates />
  </Map.Toolbar>
</Map.LocationPicker>
```

### Child components

| Component | Purpose | Configuration |
| --- | --- | --- |
| `Map.LocationPicker.Marker` | Draggable selection marker | No props |
| `Map.LocationPicker.Search` | Select a provider result | Search props below |
| `Map.LocationPicker.Locate` | Request location with retry feedback | Button attributes except `style`, `onClick`, and `children` |
| `Map.LocationPicker.Coordinates` | Display source and coordinates | `Map.Coordinates` props except `position` |

The locate child renders its button and feedback without adding a panel wrapper.
Style or group it using your toolbar when needed.

**Search child props**

- Requires `search` and `getPosition`.
- Accepts `getLabel`, `onSelect`, `placeholder`, `minLength`, `debounceMs`, and custom search children.
- Uses the picker's `zoom` and shared marker; there are no child `zoom` or `marker` props.

### Selection and camera behavior

| Interaction | Changes selection | Recenters camera |
| --- | --- | --- |
| Map click | Yes | No |
| Marker drag | Yes | No |
| Search result | Yes | Yes |
| Current-location success | Yes | Yes |
| External controlled value | Parent supplies selection | No |
| Location failure | No | No |

- No location permission is requested on mount.
- A newer selection or external value invalidates a pending location request.
- Location failure preserves the selection and offers retry.

### `useLocationPicker()`

Use inside `Map.LocationPicker` to build custom controls.

| Member | Type / signature | Purpose |
| --- | --- | --- |
| `value` | `Position` or `null` | Current selection |
| `source` | `SelectionSource` | Most recent selection source |
| `status` | `LocationRequestStatus` | Location request state |
| `error` | `Error` or `null` | Current location request error |
| `select` | Signature below | Propose a selection |
| `locate` | `() => Promise<void>` | Request location and select it on success |

```ts
select(
  position: Position | null,
  source?: SelectionSource, // Defaults to "External value".
  recenter?: boolean,      // Defaults to false.
): void;
```

**Selection sources**

| Value | Meaning |
| --- | --- |
| `"Initial location"` | Initial picker state |
| `"Map click"` | User clicked the map |
| `"Marker drag"` | User dragged the selection marker |
| `"Search result"` | User selected a search result |
| `"Current location"` | Geolocation succeeded |
| `"External value"` | External selection or default source for `select()` |

See the [complete picker example](../stories/examples/LocationPicker.tsx) for a
provider integration and custom panel layout.

## Search

### Choose a search component

| Component | Owns input and results | Moves the map | Owns selected marker |
| --- | --- | --- | --- |
| `SearchBar` / `Map.SearchBar` | Yes | Caller decides | No |
| `Map.Search` | Yes | Yes | Optional; enabled by default |
| `Map.LocationPicker.Search` | Yes | Yes | Uses shared picker marker |

### Search provider

All search components accept your provider function.

```ts
search(
  query: string,
  signal: AbortSignal,
): readonly T[] | Promise<readonly T[]>;
```

- `query` contains the original input text.
- Pass `signal` to remote fetches to support cancellation.
- Obsolete results are ignored even if a provider does not honor cancellation.
- The library does not choose a geocoding service for you.

### `SearchBar` / `Map.SearchBar`

A debounced, keyboard-accessible combobox that also works outside a map.

```tsx
<Map.SearchBar search={searchPlaces} onSelect={selectPlace}>
  <Map.SearchBar.Input placeholder="Find a city" />
  <Map.SearchBar.Results />
</Map.SearchBar>
```

#### Root props

| Prop | Type | Default |
| --- | --- | --- |
| `search` | [Search provider](#search-provider) | Required |
| `onSelect` | `(place: T) => void` | Required |
| `getLabel` | `(place: T) => string` | Uses `place.label`; required for other result shapes |
| `minLength` | `number` | `1`; checks trimmed query length |
| `debounceMs` | `number` | `250` milliseconds |
| `children` | `ReactNode` | No default children |

HTML `div` props are supported except native `onSelect` and `style`.

#### Result labels

```ts
interface SearchPlace {
  id?: string | number;
  label: string;
}
```

Results with a string `label` need no label accessor. For other shapes, supply `getLabel`:

```tsx
<SearchBar
  search={searchCities}
  getLabel={(city) => city.name}
  onSelect={selectCity}
>
  <SearchBar.Input />
  <SearchBar.Results />
</SearchBar>
```

#### Compound children

| Child | Props | Purpose |
| --- | --- | --- |
| `SearchBar.Input` | HTML `input` props except `style` | Managed input value and keyboard interaction |
| `SearchBar.Results` | HTML `ul` props except `style`, plus messages below | Styled result list |

Both children require a `SearchBar` parent. They are also available through `Map.SearchBar`.

#### Result messages

| Prop on `SearchBar.Results` | Type | Default |
| --- | --- | --- |
| `loadingMessage` | `ReactNode` | `"Searching…"` |
| `emptyMessage` | `ReactNode` | `"No results"` |
| `errorMessage` | `ReactNode` | `"Search failed"` |

#### Keyboard interaction

| Key | Action |
| --- | --- |
| Arrow Down / Arrow Up | Move through results, wrapping at either end |
| Enter | Select the active result |
| Escape | Clear the query |

## Geolocation

Geolocation APIs require browser support, permission, and HTTPS or localhost.
Choose the API that matches how you want to manage async state.

| API | Use when |
| --- | --- |
| `Map.LocationControl` | You want a ready-made button with feedback |
| `useLocationRequest` | You want request state for custom UI |
| `requestCurrentLocation` | You want a promise to await yourself |
| `useCurrentLocation` | You want to read a stable request promise with Suspense |

### `useLocationRequest()`

No map parent required. Invoke `request()` in a user interaction handler.

```tsx
function LocateButton() {
  const location = useLocationRequest();

  return (
    <button
      type="button"
      disabled={location.status === "pending"}
      onClick={() => { void location.request(); }}
    >
      {location.status === "pending" ? "Finding location…" : "Locate me"}
    </button>
  );
}
```

#### Return value

| Member | Type | Purpose |
| --- | --- | --- |
| `position` | `Position` or `null` | Successful request result |
| `status` | `LocationRequestStatus` | State listed below |
| `error` | `Error` or `null` | Failed request error |
| `request` | `(options?: PositionOptions) => Promise<Position \| null>` | Start a request |
| `reset` | `() => void` | Clear state and invalidate pending work |

#### Request states

| Status | Meaning |
| --- | --- |
| `"idle"` | No active request |
| `"pending"` | Waiting for the browser |
| `"success"` | Position available |
| `"error"` | Request failed |

#### Completion and cancellation

- Success resolves to a `Position`.
- Failure resolves to `null` and exposes the error in state.
- A newer request, reset, or unmount invalidates earlier requests; they resolve to `null` when they finish.
- Logical cancellation does not abort the browser's geolocation operation.

### `requestCurrentLocation(options?)`

Return a promise for one browser position.

```ts
requestCurrentLocation(options?: PositionOptions): Promise<Position>;
```

| Argument | Type | Default |
| --- | --- | --- |
| `options` | Browser `PositionOptions` | `{ timeout: 10000 }` when omitted |

- Call in response to a user interaction.
- Resolves to named `latitude` and `longitude` coordinates.
- Rejects if geolocation is unavailable, denied, or times out.

### `useCurrentLocation(request)`

Read a stable request promise through React's Suspense API.

| Argument | Type | Requirement |
| --- | --- | --- |
| `request` | `Promise<Position>` | Required; keep the promise stable between renders |

| Result | Behavior |
| --- | --- |
| Pending | Suspends to the nearest Suspense boundary |
| Fulfilled | Returns `Position` |
| Rejected | Throws to the nearest error boundary |

Create the promise in a click handler and keep it in state. See the
[request-location example](../README.md#request-the-users-location) for the full pattern.

## Hooks

### Map access

Call these hooks inside `Map.Root` or `MapContainer`.

| Hook | Arguments | Returns |
| --- | --- | --- |
| `useMap` | None | Live `Leaflet.Map` instance |
| `useLeaflet` | None | Client-loaded Leaflet module |
| `useMapView` | None | `MapViewSnapshot` |
| `useController` / `Map.useController` | None | Controller methods below |
| `useMapEvents` | `MapEventHandlers` | Live `Leaflet.Map` instance |

### `MapViewSnapshot`

A readonly snapshot, updated on `moveend` and `zoomend`.

| Field | Type | Purpose |
| --- | --- | --- |
| `center` | `readonly [latitude: number, longitude: number]` | Current center |
| `zoom` | `number` | Current zoom |

### Controller

```tsx
const map = Map.useController();
map.flyTo(home, 14);
```

| Member | Purpose | Returns |
| --- | --- | --- |
| `native` | Underlying map property | `Leaflet.Map` |
| `zoomIn(delta?)` | Increase zoom | `Leaflet.Map` |
| `zoomOut(delta?)` | Decrease zoom | `Leaflet.Map` |
| `flyTo(position, zoom?, options?)` | Animate to a location | `Leaflet.Map` |
| `fitBounds(positions, options?)` | Fit a set of coordinates | `Leaflet.Map` |

**Method arguments**

| Argument | Type |
| --- | --- |
| `delta` | `number` |
| `position` | `PositionExpression` |
| `zoom` | `number` |
| Fly-to `options` | `Leaflet.ZoomPanOptions` |
| `positions` | `readonly PositionExpression[]` |
| Fit-bounds `options` | `Leaflet.FitBoundsOptions` |

### `useMapEvents(handlers)`

Subscribe to map events with typed named coordinates.

```tsx
useMapEvents({
  click: (event) => selectPosition(event.position),
});
```

| Event kind | `event.position` | Other fields |
| --- | --- | --- |
| Geographic, such as `click` | Required `Position` | Original Leaflet event fields remain available |
| Non-geographic, such as `zoomend` | Optional `Position` | Original Leaflet event fields remain available |

- Import from `releaf` or `releaf/events`.
- Component `eventHandlers` props use native Leaflet event types instead.
- For native plugins, add them in an effect and remove them in cleanup.

## Related examples

- [Complete location picker](../stories/examples/LocationPicker.tsx)
- [Navigation toolbox](../stories/examples/Navigation.tsx)
- [Provider-independent search](../stories/examples/SearchPlacesExample.tsx)
- [Offline preview](../stories/examples/OfflinePreviewExample.tsx): a schematic recipe, without geographic tile caching.

## Icons

Built-in controls use Lucide by default, matching this project's shadcn configuration.
Wrap your maps in `IconProvider` to use your app's icon library, including Phosphor.
Install your chosen icon package in your app before importing it.

```tsx
import { IconProvider, Map } from "releaf";
import { PlusIcon, MinusIcon } from "@phosphor-icons/react";

<IconProvider icons={{
  plus: <PlusIcon aria-hidden="true" />,
  minus: <MinusIcon aria-hidden="true" />,
}}>
  <Map.Root className="h-96" options={{ zoomControl: false }}>
    <Map.View position={{ latitude: 38.713, longitude: -9.139 }} zoom={13} />
    <Map.Tiles.OpenStreetMap />
    <Map.Navigation />
  </Map.Root>
</IconProvider>
```

| Slot | Used by |
| --- | --- |
| `plus` | Zoom in |
| `minus` | Zoom out |
| `locate` | Current-location buttons |
| `pin` | Navigation home action |
| `fit` | Fit markers action |
| `copy` | Copy coordinates |

`icons` accepts React nodes. Omitted slots inherit from the nearest provider or
use the defaults. Set a slot to `null` to hide it. Mark decorative icons with
`aria-hidden="true"`; the controls retain their accessible labels.
