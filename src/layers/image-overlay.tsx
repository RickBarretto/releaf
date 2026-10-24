"use client"

import type * as Leaflet from "leaflet"
import { useEffect, useState } from "react"
import { useMapContext } from "../context"
import { renderLayer } from "./layer-ready"
import { type LayerProps, useLayer } from "./shared"

export interface ImageOverlayProps
  extends LayerProps<Leaflet.ImageOverlay, Leaflet.ImageOverlayOptions> {
  url: string
  bounds: Leaflet.LatLngBoundsExpression
  opacity?: number
  zIndex?: number
}

/**
 * Stretches an image across geographic bounds on the map.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. URL, bounds, opacity, and zIndex are mutable; omitted opacity and zIndex
 * restore their initial values.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function ImageOverlay(props: ImageOverlayProps) {
  const { leaflet } = useMapContext()
  const [defaults] = useState(() => ({
    opacity: props.options?.opacity ?? 1,
    zIndex: props.options?.zIndex ?? 1,
  }))
  const layer = useLayer((L) =>
    L.imageOverlay(props.url, props.bounds, props.options),
  )

  useEffect(() => {
    layer?.setUrl(props.url)
  }, [layer, props.url])

  useEffect(() => {
    const bounds =
      props.bounds instanceof leaflet.LatLngBounds
        ? props.bounds
        : leaflet.latLngBounds(props.bounds)
    layer?.setBounds(bounds)
  }, [layer, leaflet, props.bounds])

  useEffect(() => {
    layer?.setOpacity(props.opacity ?? defaults.opacity)
  }, [layer, props.opacity, defaults])

  useEffect(() => {
    layer?.setZIndex(props.zIndex ?? defaults.zIndex)
  }, [layer, props.zIndex, defaults])

  return renderLayer(layer, props)
}
