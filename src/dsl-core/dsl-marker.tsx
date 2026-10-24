"use client"

import type { MarkerProps } from "../layers"
import { Marker } from "../layers"
import { type PositionExpression, toLatLng } from "./shared"

export interface DSLMarkerProps extends Omit<MarkerProps, "position"> {
  position: PositionExpression
}

export function DSLMarker({ position, ...props }: DSLMarkerProps) {
  return <Marker {...props} position={toLatLng(position)} />
}
