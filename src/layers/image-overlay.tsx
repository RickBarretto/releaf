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

/** An image stretched across mutable geographic bounds. */
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
