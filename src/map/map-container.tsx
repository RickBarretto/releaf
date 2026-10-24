"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react"
import { useEffect, useRef, useState } from "react"
import type { MapContextValue } from "../context"
import { cn } from "../lib/utils"
import { Ready } from "./ready"

export interface MapContainerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "style"> {
  /** Creation-only options. Change the component key to recreate the map. */
  options?: Leaflet.MapOptions
  /** Initial camera only; use MapView for subsequent camera changes. */
  initialCenter?: Leaflet.LatLngExpression
  initialZoom?: number
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  ref?: Ref<Leaflet.Map>
  /** Rendered until Leaflet loads and the map instance is ready. */
  fallback?: ReactNode
}

/**
 * Creates the Leaflet map and provides context for all nested map components.
 *
 * Initial center, zoom, and options are read once; change the key to recreate the map.
 * Render camera updates with MapView. The fallback is shown while Leaflet loads.
 * Unmounting removes the map and its resize observer.
 */
export function MapContainer({
  options,
  initialCenter = [0, 0],
  initialZoom = 2,
  eventHandlers,
  ref,
  fallback = null,
  children,
  className,
  ...props
}: MapContainerProps) {
  const container = useRef<HTMLDivElement>(null)
  const [initialOptions] = useState(() => ({
    center: initialCenter,
    zoom: initialZoom,
    ...options,
  }))
  const [context, setContext] = useState<MapContextValue | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    let map: Leaflet.Map | undefined
    let observer: ResizeObserver | undefined

    // Leaflet reads window at module scope, so never import it during SSR.
    void import("leaflet")
      .then((leaflet) => {
        if (cancelled || !container.current) return

        map = leaflet.map(container.current, initialOptions)
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() =>
            map?.invalidateSize({ pan: false }),
          )
          observer.observe(container.current)
        }
        setContext({ map, leaflet })
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause : new Error(String(cause)))
      })

    return () => {
      cancelled = true
      observer?.disconnect()
      map?.remove()
      setContext(null)
    }
  }, [initialOptions])

  if (error) throw error

  return (
    <div {...props} data-slot="map" className={cn("h-[400px]", className)}>
      <div
        ref={container}
        data-slot="map-container"
        className="h-full w-full"
      />
      {context ? (
        <Ready context={context} mapRef={ref} eventHandlers={eventHandlers}>
          {children}
        </Ready>
      ) : (
        fallback
      )}
    </div>
  )
}
