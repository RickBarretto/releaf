"use client"

import {
  Coordinates,
  LayerSwitcher,
  LocationControl,
  LocationPicker,
  MapSearch,
  Navigation,
} from "./controls"
import { MapPrimitives } from "./dsl-core"

export {
  type ActionProps,
  type CustomTilesProps,
  type DSLMarkerProps,
  type FitBoundsProps,
  type FlyToProps,
  type LocateProps,
  type Position,
  type PositionExpression,
  type ToolbarProps,
  toLatLng,
  useController,
  type ViewProps,
  type ZoomProps,
} from "./dsl-core"

/**
 * Compound map API combining the map provider, layers, actions, and controls.
 *
 * Start with Map.Root; components that read map context must be its descendants.
 * Positions accept named latitude/longitude coordinates or Leaflet coordinates.
 *
 * @example
 * ```tsx
 * <Map.Root initialCenter={[-23.55, -46.63]} initialZoom={13}>
 *   <Map.Tiles.OpenStreetMap />
 *   <Map.Marker position={{ latitude: -23.55, longitude: -46.63 }}>
 *     <Map.Popup>Selected place</Map.Popup>
 *   </Map.Marker>
 *   <Map.Navigation />
 * </Map.Root>
 * ```
 */
const ReleafMap = {
  ...MapPrimitives,
  Navigation,
  Coordinates,
  LayerSwitcher,
  LocationControl,
  LocationPicker,
  Search: MapSearch,
}

export { ReleafMap as Map }
