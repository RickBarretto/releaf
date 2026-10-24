"use client"

import type { MarkerProps } from "../layers"
import { Marker } from "../layers"
import { type PositionExpression, toLatLng } from "./shared"

export interface DSLMarkerProps extends Omit<MarkerProps, "position"> {
  position: PositionExpression
}

/**
 * Adapts Map.Marker’s named or Leaflet coordinates to the base Marker component.
 *
 * Render inside Map.Root or a layer group. Other props, events, refs, and nested
 * popups or tooltips are forwarded to Marker.
 */
export function DSLMarker({ position, ...props }: DSLMarkerProps) {
  return <Marker {...props} position={toLatLng(position)} />
}
