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
