"use client"

import { useContext, useEffect } from "react"
import { AttributionContext } from "./shared"

export interface MapAttributionProps {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
  /** HTML prefix, as supported by Leaflet. Provider credits remain visible. */
  prefix?: string | false
  className?: string
}

/**
 * Configures the current map’s built-in attribution control.
 *
 * Render inside MapContainer; the last mounted configuration takes precedence.
 * Provider credits remain visible, and unmounting restores the prior configuration.
 */
export function MapAttribution({
  top,
  bottom,
  left,
  right,
  prefix,
  className,
}: MapAttributionProps) {
  const register = useContext(AttributionContext)
  if (!register) throw new Error("Map.Attribution must be inside Map.Root")
  useEffect(() => {
    const configuration = { top, bottom, left, right, prefix, className }
    register((current) => [...current, configuration])
    return () =>
      register((current) => current.filter((item) => item !== configuration))
  }, [register, top, bottom, left, right, prefix, className])
  return null
}
