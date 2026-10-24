"use client"

import type * as Leaflet from "leaflet"
import { LayerContainerContext } from "../context"
import { renderLayer } from "./layer-ready"
import { type LayerProps, useLayer } from "./shared"

export type FeatureGroupProps = LayerProps<
  Leaflet.FeatureGroup,
  Leaflet.LayerOptions
>

/** Group children and propagate their events to the group. */
export function FeatureGroup(props: FeatureGroupProps) {
  const layer = useLayer((L) => L.featureGroup([], props.options))

  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null
}
