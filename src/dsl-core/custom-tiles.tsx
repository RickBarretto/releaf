"use client"

import type * as Leaflet from "leaflet"
import type { TileLayerProps } from "../layers"
import { TileLayer } from "../layers"

export interface CustomTilesProps
  extends TileLayerProps,
    Leaflet.TileLayerOptions {}

/** Explicit options override shorthand tile options at creation. */
export function CustomTiles({
  url,
  options,
  children,
  ref,
  eventHandlers,
  ...rest
}: CustomTilesProps) {
  return (
    <TileLayer
      {...rest}
      url={url}
      ref={ref}
      eventHandlers={eventHandlers}
      options={{ ...rest, ...options }}
    >
      {children}
    </TileLayer>
  )
}
