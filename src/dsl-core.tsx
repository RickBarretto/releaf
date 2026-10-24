"use client"

import { CustomTiles } from "./dsl-core/custom-tiles"
import { DSLMarker } from "./dsl-core/dsl-marker"
import { DSLPopup } from "./dsl-core/dsl-popup"
import { DSLTooltip } from "./dsl-core/dsl-tooltip"
import { FitBounds } from "./dsl-core/fit-bounds"
import { FlyTo } from "./dsl-core/fly-to"
import { Locate } from "./dsl-core/locate"
import { OpenStreetMap } from "./dsl-core/open-street-map"
import { useController } from "./dsl-core/shared"
import { Toolbar } from "./dsl-core/toolbar"
import { View } from "./dsl-core/view"
import { Zoom } from "./dsl-core/zoom"
import { ZoomIn } from "./dsl-core/zoom-in"
import { ZoomOut } from "./dsl-core/zoom-out"
import { MapAttribution, MapContainer } from "./map"
import { SearchBar } from "./search"

/**
 * Core compound map API used to assemble the public Map namespace.
 *
 * Root provides the Leaflet context; View and Zoom update its camera, Toolbar
 * hosts controls, and Actions compose buttons with imperative map operations.
 * Tiles, Marker, Popup, and Tooltip adapt the base layers to the DSL.
 */
export const MapPrimitives = {
  Root: MapContainer,
  Attribution: MapAttribution,
  Attributtion: MapAttribution,
  View,
  Zoom,
  Toolbar,
  Marker: DSLMarker,
  Popup: DSLPopup,
  Tooltip: DSLTooltip,
  Tiles: { OpenStreetMap, Custom: CustomTiles },
  Actions: { ZoomIn, ZoomOut, Locate, FlyTo, FitBounds },
  SearchBar,
  useController,
}

export type { ActionProps } from "./dsl-core/action"
export type { CustomTilesProps } from "./dsl-core/custom-tiles"
export type { DSLMarkerProps } from "./dsl-core/dsl-marker"
export type { FitBoundsProps } from "./dsl-core/fit-bounds"
export type { FlyToProps } from "./dsl-core/fly-to"
export type { LocateProps } from "./dsl-core/locate"
export {
  type Position,
  type PositionExpression,
  toLatLng,
  useController,
} from "./dsl-core/shared"
export type { ToolbarProps } from "./dsl-core/toolbar"
export type { ViewProps } from "./dsl-core/view"
export type { ZoomProps } from "./dsl-core/zoom"
