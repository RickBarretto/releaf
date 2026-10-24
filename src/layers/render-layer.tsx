"use client"

import type * as Leaflet from "leaflet"
import { LayerReady } from "./layer-ready"
import type { LayerProps } from "./shared"

export function renderLayer<T extends Leaflet.Layer>(
  layer: T | null,
  props: LayerProps<T, unknown>,
) {
  return layer ? (
    <LayerReady
      layer={layer}
      className={props.className}
      layerRef={props.ref}
      eventHandlers={props.eventHandlers}
    >
      {props.children}
    </LayerReady>
  ) : null
}
