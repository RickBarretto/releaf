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

/** A screen-sized circle whose radius is measured in pixels. */
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
