"use client";

import type * as L from "leaflet";
import { useEventHandlers, useMap } from "./context";
import type { Position } from "./dsl";

export type MapEventHandlers = {
  [K in keyof L.LeafletEventHandlerFnMap]?: L.LeafletEventHandlerFnMap[K] extends
    | ((event: infer E) => void)
    | undefined
    ? (
        event: E &
          (E extends { latlng: L.LatLng }
            ? { position: Position }
            : { position?: Position }),
      ) => void
    : never;
};
/** Leaflet events with a latitude/longitude position on geographic events. */
export function useMapEvents(handlers: MapEventHandlers): L.Map {
  const map = useMap();
  const adapted = Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => [
      name,
      (event: L.LeafletEvent) => {
        const latlng = (event as L.LeafletMouseEvent).latlng;
        const normalized = Object.assign(
          {},
          event,
          latlng
            ? { position: { latitude: latlng.lat, longitude: latlng.lng } }
            : {},
        );
        (handler as ((event: unknown) => void) | undefined)?.(normalized);
      },
    ]),
  );
  useEventHandlers(map, adapted);
  return map;
}
export type { Position } from "./dsl";
