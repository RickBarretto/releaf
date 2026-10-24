"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode, Ref } from "react"
import { useImperativeHandle } from "react"
import { LayerContext, useEventHandlers } from "../context"
import { type LayerProps, useLayerClassName } from "./shared"

/** Mount descendants only after their Leaflet parent exists. */
export function LayerReady<T extends Leaflet.Layer>({
  layer,
  layerRef,
  eventHandlers,
  className,
  children,
}: {
  layer: T
  className?: string
  layerRef?: Ref<T>
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  children?: ReactNode
}) {
  useImperativeHandle(layerRef, () => layer, [layer])

  useEventHandlers(layer, eventHandlers)
  useLayerClassName(layer, className)

  return <LayerContext value={layer}>{children}</LayerContext>
}

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
