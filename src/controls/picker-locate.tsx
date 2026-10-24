"use client"

import type { ComponentPropsWithoutRef } from "react"
import { LocationFeedback } from "./location-feedback"
import { useLocationPicker } from "./shared"

export function PickerLocate(
  props: Omit<
    ComponentPropsWithoutRef<"button">,
    "style" | "onClick" | "children"
  >,
) {
  const picker = useLocationPicker()
  return (
    <LocationFeedback
      {...picker}
      buttonProps={props}
      request={() => {
        void picker.locate()
      }}
    />
  )
}
