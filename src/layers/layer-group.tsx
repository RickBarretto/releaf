"use client"

import type * as Leaflet from "leaflet"
import { LayerContainerContext } from "../context"
import { renderLayer } from "./render-layer"
import { type LayerProps, useLayer } from "./shared"

export type LayerGroupProps = LayerProps<
  Leaflet.LayerGroup,
  Leaflet.LayerOptions
>

/**
 * Groups nested layers for shared membership without propagating their events.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Children mount after the group exists and are removed with their parent.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function LayerGroup(props: LayerGroupProps) {
  const layer = useLayer((L) => L.layerGroup([], props.options))

  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null
}
