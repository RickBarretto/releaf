"use client"

import type { ReactNode } from "react"
import { SearchBar } from "../search"
import type { MapSearchProps } from "./map-search"
import { useLocationPicker } from "./shared"

export type PickerSearchProps<T> = Omit<MapSearchProps<T>, "zoom" | "marker">

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
