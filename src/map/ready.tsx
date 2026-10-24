"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode, Ref } from "react"
import { useImperativeHandle, useState } from "react"
import type { MapContextValue } from "../context"
import { MapContext, useEventHandlers } from "../context"
import { AttributionFooter } from "./attribution-footer"
import type { MapAttributionProps } from "./map-attribution"
import { AttributionContext } from "./shared"

/**
 * Provides a ready map instance and attribution registration to descendants.
 *
 * Internal to MapContainer. Assigns the consumer ref, subscribes to map events,
 * and renders the active attribution configuration before the children.
 */
export function Ready({
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
