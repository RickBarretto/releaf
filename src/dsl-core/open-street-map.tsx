"use client"

import { CustomTiles, type CustomTilesProps } from "./custom-tiles"

/**
 * Renders Map.Tiles.OpenStreetMap with the standard OpenStreetMap tile source.
 *
 * Includes provider attribution and a default maximum zoom of 19. Supplied props
 * can override these defaults; other behavior follows CustomTiles.
 */
export function OpenStreetMap(props: Omit<CustomTilesProps, "url">) {
  return (
    <CustomTiles
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      {...props}
    />
  )
}
