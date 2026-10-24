"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { useMapContext } from "../context"

export interface MapViewProps {
  center: Leaflet.LatLngExpression
  zoom: number
  /** Animate camera changes unless reduced motion is preferred. Defaults to true. */
  animate?: boolean
}

/**
 * Updates the current map camera from Leaflet coordinates and a zoom level.
 *
 * Render inside MapContainer. User pan and zoom remain free between prop changes.
 * Animation defaults to enabled and respects reduced-motion preferences.
 */
export function MapView({ center, zoom, animate = true }: MapViewProps) {
  const { map, leaflet } = useMapContext()
  const { lat, lng } = leaflet.latLng(center)

  useEffect(() => {
    if (!map.getCenter().equals([lat, lng]) || map.getZoom() !== zoom) {
      map.setView([lat, lng], zoom, {
        animate:
          animate &&
          !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      })
    }
  }, [map, lat, lng, zoom, animate])

  return null
}
