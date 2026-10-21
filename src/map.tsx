"use client"

import type * as Leaflet from "leaflet"
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react"
import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { MapContextValue } from "./context"
import { MapContext, useEventHandlers, useMapContext } from "./context"
import { cn } from "./lib/utils"

export interface MapAttributionProps {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
  /** HTML prefix, as supported by Leaflet. Provider credits remain visible. */
  prefix?: string | false
  className?: string
}

const AttributionContext = createContext<React.Dispatch<
  React.SetStateAction<MapAttributionProps[]>
> | null>(null)

/** Customize the map's built-in attribution without duplicating provider credits. */
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

/** Keep Leaflet's live provider credits, with the same tokens as shadcn controls. */
function AttributionFooter({
  top,
  bottom,
  left,
  prefix,
  className,
}: MapAttributionProps) {
  const { map } = useMapContext()
  const position =
    `${top && !bottom ? "top" : "bottom"}${left ? "left" : "right"}` as Leaflet.ControlPosition

  useEffect(() => {
    const control = map.attributionControl
    if (!control) return

    const previousPrefix = control.options.prefix
    const previousPosition = control.getPosition()
    control.setPosition(position)
    const element = control.getContainer()
    if (!element) return
    const branding =
      '<a href="https://github.com/RickBarretto/releaf">{Re}leaf</a> · Powered by <a href="https://leafletjs.com">Leaflet</a>'
    control.setPrefix(prefix ?? branding)
    element.dataset.slot = "map-footer"
    element.setAttribute("aria-label", "Map copyright and contributors")
    // Leaflet styles are unlayered; important utilities keep its defaults from winning.
    const footerClasses =
      "box-border! max-w-[calc(100vw-2rem)]! m-2! px-2! py-1! border! border-solid! border-border! rounded-lg! bg-background! text-muted-foreground! shadow-[0_1px_3px_#0000001a]! font-[inherit]! text-[0.6875rem]! leading-normal!".split(
        " ",
      )
    const customClasses = className?.split(/\s+/).filter(Boolean) ?? []
    element.classList.add(...footerClasses, ...customClasses)
    const styleLinks = () => {
      for (const link of element.querySelectorAll("a")) {
        link.className = cn(
          link.className,
          "inline! h-auto! p-0! rounded-xs! text-foreground! text-[length:inherit]! whitespace-normal! no-underline! hover:underline! outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )
      }
    }
    styleLinks()
    const observer = new window.MutationObserver(styleLinks)
    observer.observe(element, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      control.setPrefix(
        typeof previousPrefix === "string" ? previousPrefix : false,
      )
      control.setPosition(previousPosition)
      element.classList.remove(...footerClasses, ...customClasses)
      delete element.dataset.slot
      element.removeAttribute("aria-label")
    }
  }, [map, position, prefix, className])

  return null
}

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
  const [attributions, setAttributions] = useState<MapAttributionProps[]>([])
  useImperativeHandle(mapRef, () => context.map, [context.map])

  useEventHandlers(context.map, eventHandlers)

  return (
    <MapContext value={context}>
      <AttributionContext value={setAttributions}>
        <AttributionFooter {...attributions.at(-1)} />
        {children}
      </AttributionContext>
    </MapContext>
  )
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
