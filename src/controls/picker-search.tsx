"use client"

import type { ReactNode } from "react"
import { SearchBar } from "../search"
import type { MapSearchProps } from "./map-search"
import { useLocationPicker } from "./shared"

export type PickerSearchProps<T> = Omit<MapSearchProps<T>, "zoom" | "marker">

/**
 * Searches a data source and proposes results to the surrounding LocationPicker.
 *
 * Render inside LocationPicker. getPosition maps results to named coordinates;
 * getLabel is required when results lack a label. Accepted selections recenter
 * the map, and children replace the default input and results.
 */
export function PickerSearch<T extends { label: string }>(
  props: PickerSearchProps<T>,
): ReactNode

export function PickerSearch<T>(
  props: PickerSearchProps<T> & { getLabel: (result: T) => string },
): ReactNode

export function PickerSearch<T>({
  getPosition,
  onSelect,
  placeholder = "Find a location",
  children,
  ...props
}: PickerSearchProps<T>) {
  const picker = useLocationPicker()
  return (
    <SearchBar
      {...props}
      getLabel={
        props.getLabel ?? ((result: T) => (result as { label: string }).label)
      }
      onSelect={(result) => {
        picker.select(getPosition(result), "Search result", true)
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
  )
}
