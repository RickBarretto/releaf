import type * as L from "leaflet"
import { createRef } from "react"
import {
  LayerSwitcher,
  type LayerSwitcherOption,
  // biome-ignore lint/suspicious/noShadowRestrictedNames: Map is the public compound component API.
  Map,
  MapContainer,
  Marker,
  type Position,
  SearchBar,
  useMapEvents,
} from "releaf"
import { useMapEvents as useEvents } from "releaf/events"

const position: Position = { latitude: 1, longitude: 2 }
export const valid = (
  <MapContainer ref={createRef<L.Map>()}>
    <Marker ref={createRef<L.Marker>()} position={[1, 2]} />
    <Map.Marker position={position} />
    <Map.Actions.FlyTo position={position} />
    <SearchBar
      search={() => [{ name: "City" }]}
      getLabel={(p) => p.name}
      onSelect={(p) => {
        p.name.toUpperCase()
      }}
    />
  </MapContainer>
)
export function Events() {
  useEvents({
    click: (e) => {
      e.position.latitude.toFixed()
      e.latlng.lng.toFixed()
    },
  })
  useMapEvents({
    zoomend: (e) => {
      // @ts-expect-error non-geographic events do not guarantee a position
      e.position.latitude.toFixed()
    },
  })
  return null
}
// @ts-expect-error coordinates require latitude and longitude
export const badPosition: Position = { lat: 1, lng: 2 }
// @ts-expect-error marker refs expose markers, not maps
export const badRef = <Marker position={[0, 0]} ref={createRef<L.Map>()} />
export const badSearch = (
  // @ts-expect-error custom search result shapes require getLabel
  <SearchBar search={() => [{ name: "City" }]} onSelect={() => {}} />
)
// @ts-expect-error DSL positions cannot be strings
export const badMarker = <Map.Marker position="city" />

export const controls = (
  <Map.Root>
    <Map.Navigation home={position} positions={[position]} locate />
    <Map.LocationPicker
      defaultValue={position}
      onValueChange={(value, details) => {
        value?.latitude.toFixed()
        details.source.toUpperCase()
      }}
    >
      <Map.LocationPicker.Search
        search={() => [{ name: "City", position }]}
        getLabel={(result) => result.name}
        getPosition={(result) => result.position}
      />
      <Map.LocationPicker.Marker />
      <Map.LocationPicker.Locate />
      <Map.LocationPicker.Coordinates precision={3} />
    </Map.LocationPicker>
    <Map.Search
      search={() => [{ label: "City", position }]}
      getPosition={(result) => result.position}
    />
    <Map.Actions.FitBounds positions={[position]} />
  </Map.Root>
)
export const invalidMapSearch = (
  // @ts-expect-error custom result shapes need a label accessor
  <Map.Search search={() => [{ name: "City" }]} getPosition={() => position} />
)
// @ts-expect-error picker values use named coordinates
export const invalidPicker = <Map.LocationPicker value={[1, 2]} />

function locationStateContract(state: import("releaf").LocationRequestState) {
  if (state.status === "success") {
    const position: import("releaf").Position = state.position
    void position
    // @ts-expect-error Success has no error.
    state.error
  } else if (state.status === "error") {
    const error: Error = state.error
    void error
    // @ts-expect-error Failure has no position.
    state.position
  } else {
    // @ts-expect-error Idle and pending have no position.
    state.position
  }
}
void locationStateContract
const invalidLocationState: import("releaf").LocationRequestState = {
  status: "pending",
  // @ts-expect-error Pending cannot contain a successful position.
  position: { latitude: 0, longitude: 0 },
}
void invalidLocationState

const basemaps = [
  { value: "streets", label: "Streets", layer: <Map.Tiles.OpenStreetMap /> },
  {
    value: "terrain",
    label: "Terrain",
    layer: <Map.Tiles.Custom url="terrain" />,
  },
] as const satisfies readonly LayerSwitcherOption[]
export const typedLayers = (
  <Map.LayerSwitcher
    options={basemaps}
    value="streets"
    onValueChange={(value) => {
      const inferred: "streets" | "terrain" = value
      void inferred
      // @ts-expect-error The callback is restricted to the options.
      const invalid: "other" = value
      void invalid
    }}
  />
)
export const invalidLayerValue = (
  // @ts-expect-error Selection must not widen the options' value union.
  <Map.LayerSwitcher options={basemaps} value="other" />
)
export const invalidLayerDefault = (
  // @ts-expect-error Default selection must not widen the options' value union.
  <LayerSwitcher options={basemaps} defaultValue="other" />
)
export const mixedLayers = (
  // @ts-expect-error Options and compound children are mutually exclusive.
  <Map.LayerSwitcher options={basemaps}>
    <Map.LayerSwitcher.Item value="other" label="Other">
      Other
    </Map.LayerSwitcher.Item>
  </Map.LayerSwitcher>
)
export const inlineLayers = (
  <LayerSwitcher
    options={[{ value: "one", label: "One", layer: null }]}
    onValueChange={(value) => {
      const one: "one" = value
      void one
    }}
  />
)
export const invalidLayerCallback = (
  // @ts-expect-error Callback types must not widen the options' values.
  <LayerSwitcher options={basemaps} onValueChange={(_value: "other") => {}} />
)
