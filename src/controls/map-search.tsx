"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { useMap } from "../context"
import type { Position } from "../dsl-core"
import { MapPrimitives as ReleafMap, toLatLng } from "../dsl-core"
import type { SearchBarProps } from "../search"
import { SearchBar } from "../search"
import { motion } from "./shared"

export interface MapSearchProps<T> extends Omit<SearchBarProps<T>, "onSelect"> {
  getPosition: (result: T) => Position
  onSelect?: (result: T) => void
  zoom?: number
  marker?: boolean
  placeholder?: string
}

/**
 * Searches a consumer-provided data source and moves the map to a selected result.
 *
 * Render inside MapContainer. getPosition converts a result to named coordinates;
 * getLabel is required for results without a label field. Selection defaults to
 * zoom 13 with a marker; children replace the default input and results.
 */
export function MapSearch<T extends { label: string }>(
  props: MapSearchProps<T>,
): ReactNode

export function MapSearch<T>(
  props: MapSearchProps<T> & { getLabel: (result: T) => string },
): ReactNode

export function MapSearch<T>({
  getPosition,
  onSelect,
  zoom = 13,
  marker = true,
  placeholder = "Find a location",
  children,
  ...props
}: MapSearchProps<T>) {
  const map = useMap()
  const [selected, setSelected] = useState<Position | null>(null)
  return (
    <>
      <SearchBar
        {...props}
        getLabel={
          props.getLabel ?? ((result: T) => (result as { label: string }).label)
        }
        onSelect={(result) => {
          const position = getPosition(result)
          setSelected(position)
          map.setView(toLatLng(position), zoom, { animate: motion() })
          onSelect?.(result)
        }}
      >
        {children ?? (
          <>
            <SearchBar.Input placeholder={placeholder} />
            <SearchBar.Results />
          </>
        )}
      </SearchBar>
      {marker && selected && <ReleafMap.Marker position={selected} />}
    </>
  )
}
