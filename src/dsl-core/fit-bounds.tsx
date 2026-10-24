"use client"

import type * as Leaflet from "leaflet"
import { Action, type ActionProps } from "./action"
import { type PositionExpression, useController } from "./shared"

export interface FitBoundsProps extends ActionProps {
  positions: readonly PositionExpression[]
  options?: Leaflet.FitBoundsOptions
}

/**
 * Renders Map.Actions.FitBounds to frame a collection of positions.
 *
 * Render inside Map.Root. Accepts named or Leaflet coordinates and Leaflet bounds
 * options. Disables the action for an empty collection and respects reduced motion.
 */
export function FitBounds({ positions, options, ...props }: FitBoundsProps) {
  const map = useController()
  return (
    <Action
      aria-label="Fit markers"
      title="Fit markers"
      {...props}
      disabled={positions.length === 0 ? true : props.disabled}
      run={() =>
        map.fitBounds(positions, {
          ...options,
          animate:
            options?.animate !== false &&
            !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
        })
      }
    >
      {props.children ?? "Fit markers"}
    </Action>
  )
}
