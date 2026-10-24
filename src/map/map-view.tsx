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

/** Apply camera prop changes; user pan/zoom remains free between changes. */
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
