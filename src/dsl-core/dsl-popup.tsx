"use client"

import type { PopupProps } from "../overlays"
import { Popup } from "../overlays"
import { type PositionExpression, toLatLng } from "./shared"

export function DSLPopup({
  position,
  ...props
}: Omit<PopupProps, "position"> & { position?: PositionExpression }) {
  return <Popup {...props} position={position && toLatLng(position)} />
}
