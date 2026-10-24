"use client"

import type { TooltipProps } from "../overlays"
import { Tooltip } from "../overlays"
import { type PositionExpression, toLatLng } from "./shared"

export function DSLTooltip({
  position,
  ...props
}: Omit<TooltipProps, "position"> & { position?: PositionExpression }) {
  return <Tooltip {...props} position={position && toLatLng(position)} />
}
