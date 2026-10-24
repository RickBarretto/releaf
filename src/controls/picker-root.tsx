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
  const location = useLocationRequest()
  const map = useMap()
  const pendingCamera = useRef<Position | null>(null)
  const selectedKey = selected
    ? `${selected.latitude},${selected.longitude}`
    : ""
  const [selection, setSelection] = useState<{
    key: string
    source: SelectionSource
  }>(() => ({ key: selectedKey, source: "Initial location" }))
  const source =
    selection.key === selectedKey ? selection.source : "External value"
  if (selection.key !== selectedKey) {
    // Reset the label before children render an externally replaced selection.
    setSelection({ key: selectedKey, source: "External value" })
  }
  const previousKey = useRef(selectedKey)
  function select(
    position: Position | null,
    nextSource: SelectionSource = "External value",
    recenter = false,
  ) {
    location.reset()
    const key = position ? `${position.latitude},${position.longitude}` : ""
    pendingCamera.current = recenter ? position : null
    if (value === undefined) setInternal(position)
    setSelection({ key, source: nextSource })
    onValueChange?.(position, { source: nextSource })
  }
  useEffect(() => {
    if (previousKey.current !== selectedKey) {
      location.reset()
      previousKey.current = selectedKey
    }
  }, [selectedKey, location.reset])
  useEffect(() => {
    const target = pendingCamera.current
    pendingCamera.current = null
    if (
      target &&
      selected &&
      target.latitude === selected.latitude &&
      target.longitude === selected.longitude
    ) {
      map.setView(toLatLng(selected), zoom, { animate: motion() })
    }
  })
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
        ...location,
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
