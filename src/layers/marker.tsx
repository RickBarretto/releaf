"use client"

import type * as Leaflet from "leaflet"
import { useEffect, useState } from "react"
import { renderLayer } from "./layer-ready"
import { type LayerProps, useLayer } from "./shared"

export interface MarkerProps
  extends LayerProps<Leaflet.Marker, Leaflet.MarkerOptions> {
  position: Leaflet.LatLngExpression
  opacity?: number
  draggable?: boolean
  zIndexOffset?: number
}

/** A marker with mutable position and interaction props. */
export function Marker(props: MarkerProps) {
  const { position, options, opacity, draggable, zIndexOffset } = props
  const [defaults] = useState(() => ({
    opacity: options?.opacity ?? 1,
    draggable: options?.draggable ?? false,
    zIndexOffset: options?.zIndexOffset ?? 0,
  }))
  const layer = useLayer((L) => L.marker(position, options))

  useEffect(() => {
    layer?.setLatLng(position)
  }, [layer, position])

  useEffect(() => {
    layer?.setOpacity(opacity ?? defaults.opacity)
  }, [layer, opacity, defaults])

  useEffect(() => {
    layer?.setZIndexOffset(zIndexOffset ?? defaults.zIndexOffset)
  }, [layer, zIndexOffset, defaults])

  useEffect(() => {
    if (draggable ?? defaults.draggable) layer?.dragging?.enable()
    else layer?.dragging?.disable()
  }, [layer, draggable, defaults])

  return renderLayer(layer, props)
}
