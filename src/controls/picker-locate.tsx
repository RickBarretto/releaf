"use client"

import type { ComponentPropsWithoutRef } from "react"
import { LocationFeedback } from "./location-feedback"
import { useLocationPicker } from "./shared"

/**
 * Requests current location through the surrounding LocationPicker.
 *
 * Render inside LocationPicker. Displays pending and error feedback; a successful
 * request proposes a selection and recenters once that selection is accepted.
 */
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
