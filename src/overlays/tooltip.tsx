"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode } from "react"
import { useOverlay } from "./shared"

export interface TooltipProps {
  className?: string
  children?: ReactNode
  /** Required when the tooltip is not nested inside a layer. */
  position?: Leaflet.LatLngExpression
  /** Creation-only options; change the component key to recreate the overlay. */
  options?: Leaflet.TooltipOptions
  /** Omit for native hover behavior, or control visibility explicitly. */
  open?: boolean
}

/** Render React content into a Leaflet tooltip through a persistent portal host. */
export function Tooltip(props: TooltipProps) {
  return useOverlay("tooltip", props)
}
