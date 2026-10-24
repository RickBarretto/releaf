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

/** A polygon, polygon with holes, or multi-polygon geometry. */
export function Polygon(props: PolygonProps) {
  const layer = useLayer((L) => L.polygon(props.positions, props.options))

  useEffect(() => {
    layer?.setLatLngs(props.positions)
  }, [layer, props.positions])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
