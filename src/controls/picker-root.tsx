"use client"

import { useEffect, useRef, useState } from "react"
import { useMap } from "../context"
import type { Position } from "../dsl-core"
import { MapPrimitives as ReleafMap, toLatLng } from "../dsl-core"
import { useMapEvents } from "../events"
import { cn } from "../lib/utils"
import { useLocationRequest } from "../location"
import { PickerCoordinates } from "./picker-coordinates"
import { PickerLocate } from "./picker-locate"
import { PickerMarker } from "./picker-marker"
import {
  type LocationPickerProps,
  motion,
  PickerContext,
  panel,
  type SelectionSource,
} from "./shared"

/**
 * Owns LocationPicker selection state and coordinates its compound children.
 *
 * Render inside MapContainer. Use value for controlled state or defaultValue for
 * local state; onValueChange reports the selection and its source. Map clicks
 * select a location. Omitted children render the default marker and controls.
 */
export function PickerRoot({
  value,
  defaultValue = null,
  onValueChange,
  children,
  zoom = 13,
  locationOptions,
}: LocationPickerProps) {
  const [internal, setInternal] = useState(defaultValue)
  const selected = value === undefined ? internal : value
  const [source, setSource] = useState<SelectionSource>("Initial location")
  const location = useLocationRequest()
  const map = useMap()
  const [pendingCamera, setPendingCamera] = useState<Position | null>(null)
  const selectedKey = selected
    ? `${selected.latitude},${selected.longitude}`
    : ""
  const previousKey = useRef(selectedKey)
  const proposedKey = useRef<string | null>(null)
  function select(
    position: Position | null,
    nextSource: SelectionSource = "External value",
    recenter = false,
  ) {
    location.reset()
    proposedKey.current = position
      ? `${position.latitude},${position.longitude}`
      : ""
    setPendingCamera(recenter ? position : null)
    if (value === undefined) setInternal(position)
    setSource(nextSource)
    onValueChange?.(position, { source: nextSource })
  }
  useEffect(() => {
    if (previousKey.current !== selectedKey) {
      location.reset()
      if (proposedKey.current !== selectedKey) setSource("External value")
      previousKey.current = selectedKey
    }
    proposedKey.current = null
  }, [selectedKey, location.reset])
  useEffect(() => {
    const target = pendingCamera
    if (
      target &&
      selected &&
      target.latitude === selected.latitude &&
      target.longitude === selected.longitude
    ) {
      map.setView(toLatLng(selected), zoom, { animate: motion() })
    }
    if (pendingCamera) setPendingCamera(null)
  }, [pendingCamera, selected, map, zoom])
  useMapEvents({ click: (event) => select(event.position, "Map click") })
  async function locate() {
    const position = await location.request(locationOptions)
    if (position) select(position, "Current location", true)
  }
  return (
    <PickerContext
      value={{
        value: selected,
        source,
        select,
        locate,
        status: location.status,
        error: location.error,
      }}
    >
      {children ?? (
        <>
          <PickerMarker />
          <ReleafMap.Toolbar
            top
            left
            data-slot="map-panel"
            className={cn(panel, "flex flex-col items-start gap-2")}
          >
            <PickerLocate />
          </ReleafMap.Toolbar>
          <ReleafMap.Toolbar bottom left>
            <PickerCoordinates />
          </ReleafMap.Toolbar>
        </>
      )}
    </PickerContext>
  )
}
