"use client"

import type * as Leaflet from "leaflet"
import { MapPrimitives as ReleafMap, toLatLng } from "../dsl-core"
import { useLocationPicker } from "./shared"

export function PickerMarker() {
  const picker = useLocationPicker()
  return (
    picker.value && (
      <ReleafMap.Marker
        position={picker.value}
        draggable
        options={{
          autoPan: true,
          title: "Drag to select a location",
          alt: "Selected location",
        }}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as Leaflet.Marker
            const position = marker.getLatLng()
            // Restore the authoritative value until React accepts this drag.
            if (picker.value) marker.setLatLng(toLatLng(picker.value))
            picker.select(
              { latitude: position.lat, longitude: position.lng },
              "Marker drag",
            )
          },
        }}
      >
        <ReleafMap.Tooltip>Drag me to refine your selection</ReleafMap.Tooltip>
      </ReleafMap.Marker>
    )
  )
}
