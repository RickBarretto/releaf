"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./render-layer"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface PolylineProps
  extends PathProps<Leaflet.Polyline, Leaflet.PolylineOptions> {
  positions: Leaflet.LatLngExpression[] | Leaflet.LatLngExpression[][]
}

/**
 * Displays a line or multi-line geometry with mutable positions and path style.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Removed path-style overrides restore the layer’s initial style values.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function Polyline(props: PolylineProps) {
  const layer = useLayer((L) => L.polyline(props.positions, props.options))

  useEffect(() => {
    layer?.setLatLngs(props.positions)
  }, [layer, props.positions])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
