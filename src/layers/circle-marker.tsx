"use client"

import type * as Leaflet from "leaflet"
import { useEffect, useState } from "react"
import { renderLayer } from "./layer-ready"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface CircleMarkerProps
  extends PathProps<Leaflet.CircleMarker, Leaflet.CircleMarkerOptions> {
  center: Leaflet.LatLngExpression
  radius?: number
}

/**
 * Displays a circular marker with a radius measured in screen pixels.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Center, radius, and pathOptions are mutable; omitted radius restores its initial value.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function CircleMarker(props: CircleMarkerProps) {
  const [initialRadius] = useState(() => props.options?.radius ?? 10)
  const layer = useLayer((L) => L.circleMarker(props.center, props.options))

  useEffect(() => {
    layer?.setLatLng(props.center)
  }, [layer, props.center])

  useEffect(() => {
    layer?.setRadius(props.radius ?? initialRadius)
  }, [layer, props.radius, initialRadius])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
