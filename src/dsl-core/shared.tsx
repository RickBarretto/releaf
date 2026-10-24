"use client"

import type * as Leaflet from "leaflet"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useMap } from "../context"

/** Geographic coordinates in degrees, independent of Leaflet tuple ordering. */
export interface Position {
  latitude: number
  longitude: number
}

export type PositionExpression = Position | Leaflet.LatLngExpression

/** Normalize named coordinates while preserving native Leaflet inputs. */
export function toLatLng(
  position: PositionExpression,
): Leaflet.LatLngExpression {
  return "latitude" in position
    ? [position.latitude, position.longitude]
    : position
}

/** Stable imperative actions for the current map. */
export function useController() {
  const map = useMap()

  return useMemo(
    () => ({
      native: map,
      zoomIn: (delta?: number) => map.zoomIn(delta),
      zoomOut: (delta?: number) => map.zoomOut(delta),
      flyTo: (
        position: PositionExpression,
        zoom?: number,
        options?: Leaflet.ZoomPanOptions,
      ) => map.flyTo(toLatLng(position), zoom, options),
      fitBounds: (
        positions: readonly PositionExpression[],
        options?: Leaflet.FitBoundsOptions,
      ) =>
        map.fitBounds(
          positions.map(toLatLng) as Leaflet.LatLngTuple[],
          options,
        ),
    }),
    [map],
  )
}

export function useZoomLimit(limit: "min" | "max") {
  const map = useMap()
  const subscribe = useCallback(
    (notify: () => void) => {
      map.on("zoomend zoomlevelschange", notify)
      return () => {
        map.off("zoomend zoomlevelschange", notify)
      }
    },
    [map],
  )
  const snapshot = () =>
    limit === "max"
      ? map.getZoom() >= map.getMaxZoom()
      : map.getZoom() <= map.getMinZoom()
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
