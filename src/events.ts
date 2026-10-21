"use client";

import type * as Leaflet from "leaflet";
import { useEventHandlers, useMap } from "./context";
import type { Position } from "./dsl";

export type MapEventHandlers = {
  [K in keyof Leaflet.LeafletEventHandlerFnMap]?: Leaflet.LeafletEventHandlerFnMap[K] extends
    | ((event: infer E) => void)
    | undefined
    ? (
        event: E &
          (E extends { latlng: Leaflet.LatLng }
            ? { position: Position }
            : { position?: Position }),
      ) => void
    : never;
};
/** Leaflet events with a latitude/longitude position on geographic events. */
export function useMapEvents(handlers: MapEventHandlers): Leaflet.Map {
  const map = useMap();
  const adapted = Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => [
      name,
      (event: Leaflet.LeafletEvent) => {
        const latlng = (event as Leaflet.LeafletMouseEvent).latlng;
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
