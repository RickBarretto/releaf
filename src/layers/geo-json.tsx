"use client"

import type * as Leaflet from "leaflet"
import { useEffect } from "react"
import { renderLayer } from "./render-layer"
import { type LayerProps, useLayer } from "./shared"

export interface GeoJSONProps
  extends LayerProps<Leaflet.GeoJSON, Leaflet.GeoJSONOptions> {
  data: Parameters<typeof Leaflet.geoJSON>[0]
  pathOptions?: Leaflet.PathOptions
}

/**
 * Displays GeoJSON features, replacing them when the data identity changes.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Memoize data to avoid unnecessary replacement. pathOptions are reapplied after
 * features change; omitted style overrides reset to the layer’s configured style.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function GeoJSON(props: GeoJSONProps) {
  const layer = useLayer((L) => L.geoJSON(undefined, props.options))

  useEffect(() => {
    if (!layer) return

    layer.clearLayers()
    if (Array.isArray(props.data)) {
      for (const feature of props.data) layer.addData(feature)
    } else if (props.data) layer.addData(props.data)
  }, [layer, props.data])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reapply styles after the preceding effect replaces GeoJSON features.
  useEffect(() => {
    layer?.resetStyle()
    if (props.pathOptions) layer?.setStyle(props.pathOptions)
  }, [layer, props.data, props.pathOptions])

  return renderLayer(layer, props)
}
