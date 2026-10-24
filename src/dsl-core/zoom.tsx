"use client"

import { useEffect } from "react"
import { useMap } from "../context"

export interface ZoomProps {
  zoom: number
  minZoom?: number
  maxZoom?: number
}

/**
 * Applies Map.Zoom’s zoom level and temporary minimum and maximum zoom limits.
 *
 * Render inside Map.Root. Omitted limits use zero and infinity. Previous map
 * limits are restored when the effect is cleaned up.
 */
export function Zoom({ zoom, minZoom, maxZoom }: ZoomProps) {
  const map = useMap()

  useEffect(() => {
    const previous = { min: map.options.minZoom, max: map.options.maxZoom }
    map.setMinZoom(minZoom ?? 0)
    map.setMaxZoom(maxZoom ?? Infinity)

    return () => {
      map.setMinZoom(previous.min ?? 0)
      map.setMaxZoom(previous.max ?? Infinity)
    }
  }, [map, minZoom, maxZoom])

  useEffect(() => {
    map.setZoom(zoom)
  }, [map, zoom])

  return null
}
