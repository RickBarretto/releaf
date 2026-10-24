"use client"

import type * as Leaflet from "leaflet"
import { LayerContainerContext } from "../context"
import { renderLayer } from "./layer-ready"
import { type LayerProps, useLayer } from "./shared"

export type LayerGroupProps = LayerProps<
  Leaflet.LayerGroup,
  Leaflet.LayerOptions
>

/** Group children for shared membership without propagating their events. */
export function LayerGroup(props: LayerGroupProps) {
  const layer = useLayer((L) => L.layerGroup([], props.options))

  return layer ? (
    <LayerContainerContext value={layer}>
      {renderLayer(layer, props)}
    </LayerContainerContext>
  ) : null
}
