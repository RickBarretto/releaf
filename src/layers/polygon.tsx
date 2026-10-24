"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./layer-ready"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface PolygonProps
  extends PathProps<Leaflet.Polygon, Leaflet.PolylineOptions> {
  positions:
    | Leaflet.LatLngExpression[]
    | Leaflet.LatLngExpression[][]
    | Leaflet.LatLngExpression[][][]
}

/**
 * Displays a polygon, polygon with holes, or multi-polygon geometry.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Positions and pathOptions are mutable; removed style overrides restore defaults.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function Polygon(props: PolygonProps) {
  const layer = useLayer((L) => L.polygon(props.positions, props.options))

  useEffect(() => {
    layer?.setLatLngs(props.positions)
  }, [layer, props.positions])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
