"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react"
import { useEffect, useImperativeHandle, useRef, useState } from "react"
import type { MapContextValue } from "./context"
import { MapContext, useEventHandlers, useMapContext } from "./context"

export interface MapContainerProps extends ComponentPropsWithoutRef<"div"> {
  /** Creation-only options. Change the component key to recreate the map. */
  options?: Leaflet.MapOptions
  initialCenter?: Leaflet.LatLngExpression
  initialZoom?: number
  eventHandlers?: Leaflet.LeafletEventHandlerFnMap
  ref?: Ref<Leaflet.Map>
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

export function MapContainer({
  options,
  initialCenter = [0, 0],
  initialZoom = 2,
  eventHandlers,
  ref,
  fallback = null,
  children,
  style,
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
    <div {...props} style={{ height: 400, ...style }}>
      <div ref={container} style={{ height: "100%", width: "100%" }} />
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
  animate?: boolean
}

/** Apply camera prop changes; user pan/zoom remains free between changes. */
export function MapView({ center, zoom, animate = false }: MapViewProps) {
  const { map, leaflet } = useMapContext()
  const { lat, lng } = leaflet.latLng(center)

  useEffect(() => {
    if (!map.getCenter().equals([lat, lng]) || map.getZoom() !== zoom) {
      map.setView([lat, lng], zoom, { animate })
    }
  }, [map, lat, lng, zoom, animate])

  return null
}
