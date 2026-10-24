"use client"

import { CustomTiles, type CustomTilesProps } from "./custom-tiles"

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
