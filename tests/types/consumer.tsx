import type * as L from "leaflet"
import { createRef } from "react"
import {
  MapContainer,
  Marker,
  type Position,
  Map as ReleafMap,
  SearchBar,
  useMapEvents,
} from "releaf"
import { useMapEvents as useEvents } from "releaf/events"

const position: Position = { latitude: 1, longitude: 2 }
export const valid = (
  <MapContainer ref={createRef<L.Map>()}>
    <Marker ref={createRef<L.Marker>()} position={[1, 2]} />
    <ReleafMap.Marker position={position} />
    <ReleafMap.Actions.FlyTo position={position} />
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
export const badMarker = <ReleafMap.Marker position="city" />
