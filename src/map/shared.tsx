"use client"

import { createContext } from "react"
import type { MapAttributionProps } from "./map-attribution"

export const AttributionContext = createContext<React.Dispatch<
  React.SetStateAction<MapAttributionProps[]>
> | null>(null)
