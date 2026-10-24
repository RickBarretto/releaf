"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode } from "react"
import { useOverlay } from "./shared"

export interface PopupProps {
  className?: string
  children?: ReactNode
  /** Required for standalone popups; nested popups bind to their layer. */
  position?: Leaflet.LatLngExpression
  /** Creation-only options; change the component key to recreate the overlay. */
  options?: Leaflet.PopupOptions
  /** Omit for Leaflet's click-to-open behavior, or control visibility. */
  open?: boolean
}

/** Render React content into a Leaflet popup through a persistent portal host. */
export function Popup(props: PopupProps) {
  return useOverlay("popup", props)
}
