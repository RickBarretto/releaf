"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./layer-ready"
import { type PathProps, useLayer, usePathStyle } from "./shared"

export interface CircleProps
  extends PathProps<Leaflet.Circle, Leaflet.CircleMarkerOptions> {
  center: Leaflet.LatLngExpression
  radius: number
}

/** A geographic circle whose radius is measured in meters. */
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
