"use client"

import { useEffect } from "react"
import { useMapContext } from "../context"
import { type PositionExpression, toLatLng } from "./shared"

export interface ViewProps {
  position: PositionExpression
  zoom?: number
  /** Animate camera changes unless reduced motion is preferred. Defaults to true. */
  animate?: boolean
}

/**
 * Applies Map.View camera updates using named coordinates or Leaflet coordinates.
 *
 * Render inside Map.Root. Omitted zoom preserves the map’s current zoom.
 * Animation defaults to enabled and respects reduced-motion preferences.
 */
export function View({ position, zoom, animate = true }: ViewProps) {
  const { map, leaflet } = useMapContext()
  const { lat, lng } = leaflet.latLng(toLatLng(position))

  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom(), {
      animate:
        animate &&
        !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    })
  }, [map, lat, lng, zoom, animate])

  return null
}
