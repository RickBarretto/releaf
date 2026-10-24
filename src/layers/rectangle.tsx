"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./layer-ready"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface RectangleProps extends PathProps<Leaflet.Rectangle> {
  bounds: Leaflet.LatLngBoundsExpression
}

/**
 * Displays a rectangle defined by mutable geographic bounds.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Bounds and pathOptions update the existing layer.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function Rectangle(props: RectangleProps) {
  const layer = useLayer((L) => L.rectangle(props.bounds, props.options))

  useEffect(() => {
    layer?.setBounds(props.bounds)
  }, [layer, props.bounds])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
