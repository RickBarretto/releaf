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

/**
 * Displays a marker with mutable position, opacity, dragging, and stacking.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Removed opacity, draggable, and zIndexOffset props restore their initial values.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
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
