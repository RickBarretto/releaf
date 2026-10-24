"use client"

import type { ComponentPropsWithoutRef } from "react"
import { useEffect, useEffectEvent } from "react"
import { useMap } from "../context"
import type { Position } from "../dsl-core"
import { toLatLng } from "../dsl-core"
import { cn } from "../lib/utils"
import { useLocationRequest } from "../location"
import { LocationFeedback } from "./location-feedback"
import { motion, panel } from "./shared"

export interface LocationControlProps
  extends Omit<ComponentPropsWithoutRef<"div">, "style" | "onError"> {
  options?: PositionOptions
  compact?: boolean
  recenter?: boolean
  zoom?: number
  onSuccess?: (position: Position) => void
  onError?: (error: Error) => void
}

/**
 * Requests the browser’s current location and displays progress or retry feedback.
 *
 * Render inside MapContainer. By default, a successful request recenters at zoom 16.
 * Use recenter={false} to only report onSuccess; compact renders an icon control.
 */
export function LocationControl({
  options,
  compact = false,
  recenter = true,
  zoom = 16,
  onSuccess,
  onError,
  className,
  ...props
}: LocationControlProps) {
  const location = useLocationRequest()
  const map = useMap()
  const reportError = useEffectEvent((error: Error) => onError?.(error))
  useEffect(() => {
    if (location.error) reportError(location.error)
  }, [location.error])
  async function request() {
    const position = await location.request(options)
    if (!position) return
    if (recenter) map.setView(toLatLng(position), zoom, { animate: motion() })
    onSuccess?.(position)
  }
  return (
    <div
      data-slot="map-panel"
      className={cn(
        compact ? "size-9 shrink-0" : panel,
        "flex flex-col items-start gap-2",
        className,
      )}
      {...props}
    >
      <LocationFeedback
        {...location}
        compact={compact}
        request={() => {
          void request()
        }}
      />
    </div>
  )
}
