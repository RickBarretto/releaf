"use client"

import type { PopupProps } from "../overlays"
import { Popup } from "../overlays"
import { type PositionExpression, toLatLng } from "./shared"

/**
 * Adapts Map.Popup’s optional named position to the base Popup component.
 *
 * Nest inside a layer to bind the popup, or provide a position for a standalone
 * popup. Other overlay props and React children are forwarded unchanged.
 */
export function DSLPopup({
  position,
  ...props
}: Omit<PopupProps, "position"> & { position?: PositionExpression }) {
  return <Popup {...props} position={position && toLatLng(position)} />
}
