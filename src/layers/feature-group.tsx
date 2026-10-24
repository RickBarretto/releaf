"use client"

import type * as Leaflet from "leaflet"
import { LayerContainerContext } from "../context"
import { renderLayer } from "./layer-ready"
import { type LayerProps, useLayer } from "./shared"

export type FeatureGroupProps = LayerProps<
  Leaflet.FeatureGroup,
  Leaflet.LayerOptions
>

/**
 * Groups nested layers and propagates their events through the group.
 *
 * Render inside MapContainer or a layer group. Options are creation-only; change
 * the key to recreate the layer. Children mount after the group exists and are removed with their parent.
 * Supports layer refs, event handlers, CSS classes, and nested overlays.
 */
export function FeatureGroup(props: FeatureGroupProps) {
  const layer = useLayer((L) => L.featureGroup([], props.options))

  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null
}
