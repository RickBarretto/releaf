"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react"
import { useEffect, useImperativeHandle, useRef, useState } from "react"
import type { MapContextValue } from "./context"
import { MapContext, useEventHandlers, useMapContext } from "./context"
import { cn } from "./lib/utils"

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

function Ready({
  context,
  mapRef,
  eventHandlers,
  children,
}: {
  context: MapContextValue
  mapRef?: Ref<Leaflet.Map>
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  children?: ReactNode
}) {
  useImperativeHandle(mapRef, () => context.map, [context.map])

  useEventHandlers(context.map, eventHandlers)

  return <MapContext value={context}>{children}</MapContext>
}

/** Load Leaflet in the browser and own the map, resize observer, and teardown. */
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

export interface MapViewProps {
  center: Leaflet.LatLngExpression
  zoom: number
  /** Animate camera changes unless reduced motion is preferred. Defaults to true. */
  animate?: boolean
}

/** Apply camera prop changes; user pan/zoom remains free between changes. */
export function MapView({ center, zoom, animate = true }: MapViewProps) {
  const { map, leaflet } = useMapContext()
  const { lat, lng } = leaflet.latLng(center)

  useEffect(() => {
    if (!map.getCenter().equals([lat, lng]) || map.getZoom() !== zoom) {
      map.setView([lat, lng], zoom, {
        animate:
          animate &&
          !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      })
    }
  }, [map, lat, lng, zoom, animate])

  return null
}
