"use client"

import type { TooltipProps } from "../overlays"
import { Tooltip } from "../overlays"
import { type PositionExpression, toLatLng } from "./shared"

/**
 * Adapts Map.Tooltip’s optional named position to the base Tooltip component.
 *
 * Nest inside a layer to bind the tooltip, or provide a standalone position.
 * Other overlay props and React children are forwarded unchanged.
 */
export function DSLTooltip({
  position,
  ...props
}: Omit<TooltipProps, "position"> & { position?: PositionExpression }) {
  return <Tooltip {...props} position={position && toLatLng(position)} />
}
