"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./layer-ready"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface PolylineProps
  extends PathProps<Leaflet.Polyline, Leaflet.PolylineOptions> {
  positions: Leaflet.LatLngExpression[] | Leaflet.LatLngExpression[][]
}

/** A line or multi-line geometry with mutable positions and style. */
export function Polyline(props: PolylineProps) {
  const layer = useLayer((L) => L.polyline(props.positions, props.options))

  useEffect(() => {
    layer?.setLatLngs(props.positions)
  }, [layer, props.positions])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
