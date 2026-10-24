"use client"

import type * as Leaflet from "leaflet"
import type { TileLayerProps } from "../layers"
import { TileLayer } from "../layers"

export interface CustomTilesProps
  extends TileLayerProps,
    Leaflet.TileLayerOptions {}

/**
 * Renders Map.Tiles.Custom with a URL and shorthand Leaflet tile options.
 *
 * Render inside Map.Root. Explicit options override shorthand options at creation.
 * URL, opacity, and stacking updates are handled by the underlying TileLayer;
 * change the component key to recreate creation-only options.
 */
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
