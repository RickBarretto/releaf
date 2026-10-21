"use client"

import type * as Leaflet from "leaflet"
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useSyncExternalStore,
} from "react"

export interface MapContextValue {
  map: Leaflet.Map
  leaflet: typeof Leaflet
}

export const MapContext = createContext<MapContextValue | null>(null)

export const LayerContext = createContext<Leaflet.Layer | null>(null)

export const LayerContainerContext = createContext<Leaflet.LayerGroup | null>(
  null,
)

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context)
    throw new Error(
      "Releaf hooks and layers must be used inside <MapContainer>.",
    )

  return context
}

/** Access the live map for plugins and imperative operations. */
export function useMap(): Leaflet.Map {
  return useMapContext().map
}

/** Access the browser-loaded Leaflet module without breaking server rendering. */
export function useLeaflet(): typeof Leaflet {
  return useMapContext().leaflet
}

export function useEventHandlers(
  target: Leaflet.Evented | null,
  handlers?: Leaflet.LeafletEventHandlerFnMap,
): void {
  const names = Object.keys(handlers ?? {})
    .sort()
    .join(" ")
  const dispatch = useEffectEvent(
    (name: string, event: Leaflet.LeafletEvent) => {
      const handler = handlers?.[
        name as keyof Leaflet.LeafletEventHandlerFnMap
      ] as Leaflet.LeafletEventHandlerFn | undefined
      handler?.call(target, event)
    },
  )

  useEffect(() => {
    if (!target || !names) return

    const listeners = names.split(" ").map((name) => {
      const listener = (event: Leaflet.LeafletEvent) => dispatch(name, event)
      target.on(name, listener)

      return { name, listener }
    })

    return () => {
      for (const { name, listener } of listeners) target.off(name, listener)
    }
  }, [target, names])
}

/** Subscribe with fresh callbacks without reattaching unchanged event names. */
export function useMapEvents(
  handlers: Leaflet.LeafletEventHandlerFnMap,
): Leaflet.Map {
  const map = useMap()

  useEventHandlers(map, handlers)

  return map
}

export interface MapViewSnapshot {
  readonly center: readonly [latitude: number, longitude: number]
  readonly zoom: number
}

/** Subscribe to settled camera changes with a cached external-store snapshot. */
export function useMapView(): MapViewSnapshot {
  const map = useMap()
  const store = useMemo(() => {
    let snapshot: MapViewSnapshot
    const getSnapshot = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      if (
        !snapshot ||
        snapshot.center[0] !== center.lat ||
        snapshot.center[1] !== center.lng ||
        snapshot.zoom !== zoom
      ) {
        snapshot = Object.freeze({
          center: Object.freeze([center.lat, center.lng] as const),
          zoom,
        })
      }

      return snapshot
    }

    return {
      getSnapshot,
      subscribe(notify: () => void) {
        map.on("moveend zoomend", notify)

        return () => {
          map.off("moveend zoomend", notify)
        }
      },
    }
  }, [map])

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
}
