"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./layer-ready"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface RectangleProps extends PathProps<Leaflet.Rectangle> {
  bounds: Leaflet.LatLngBoundsExpression
}

/** A rectangular path with mutable geographic bounds. */
export function Rectangle(props: RectangleProps) {
  const layer = useLayer((L) => L.rectangle(props.bounds, props.options))

  useEffect(() => {
    layer?.setBounds(props.bounds)
  }, [layer, props.bounds])

  usePathStyle(layer, props.pathOptions)

  return renderLayer(layer, props)
}
