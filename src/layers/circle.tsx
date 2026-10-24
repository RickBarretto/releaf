"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./render-layer"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface CircleProps
  extends PathProps<Leaflet.Circle, Leaflet.CircleMarkerOptions> {
  center: Leaflet.LatLngExpression
  radius: number
}

/**
 * Displays a geographic circle with a radius measured in meters.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Center, radius, and pathOptions update the existing layer.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function Circle(props: CircleProps) {
  const layer = useLayer((L) =>
    L.circle(props.center, { ...props.options, radius: props.radius }),
  )

  useEffect(() => {
    layer?.setLatLng(props.center)
  }, [layer, props.center])

  useEffect(() => {
    layer?.setRadius(props.radius)
  }, [layer, props.radius])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
