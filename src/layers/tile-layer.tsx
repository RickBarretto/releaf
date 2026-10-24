"use client"

import type * as Leaflet from "leaflet"
import { useEffect, useState } from "react"
import { renderLayer } from "./layer-ready"
import { type LayerProps, useLayer } from "./shared"

export interface TileLayerProps
  extends LayerProps<Leaflet.TileLayer, Leaflet.TileLayerOptions> {
  url: string
  opacity?: number
  zIndex?: number
}

/** A tile source with mutable URL, opacity, and stacking order. */
export function TileLayer(props: TileLayerProps) {
  const { url, options, opacity, zIndex } = props
  const [defaults] = useState(() => ({
    opacity: options?.opacity ?? 1,
    zIndex: options?.zIndex ?? 1,
  }))
  const layer = useLayer((L) => L.tileLayer(url, options))

  useEffect(() => {
    layer?.setUrl(url)
  }, [layer, url])

  useEffect(() => {
    layer?.setOpacity(opacity ?? defaults.opacity)
  }, [layer, opacity, defaults])

  useEffect(() => {
    layer?.setZIndex(zIndex ?? defaults.zIndex)
  }, [layer, zIndex, defaults])

  return renderLayer(layer, props)
}
