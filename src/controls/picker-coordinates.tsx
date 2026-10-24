"use client"

import { Coordinates, type CoordinatesProps } from "./coordinates"
import { useLocationPicker } from "./shared"

/**
 * Displays the surrounding LocationPicker’s coordinates and selection source.
 *
 * Render inside LocationPicker. Formatting and clipboard options are forwarded
 * to Coordinates; children appear after the selection-source message.
 */
export function PickerCoordinates({
  children,
  ...props
}: Omit<CoordinatesProps, "position">) {
  const picker = useLocationPicker()
  return (
    <Coordinates
      aria-label="Selected coordinates"
      {...props}
      position={picker.value}
    >
      <p className="m-0 text-xs text-muted-foreground">{picker.source}</p>
      {children}
    </Coordinates>
  )
}
