"use client"

import { Coordinates, type CoordinatesProps } from "./coordinates"
import { useLocationPicker } from "./shared"

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
