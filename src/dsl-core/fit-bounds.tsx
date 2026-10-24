"use client"

import type * as Leaflet from "leaflet"
import { Action, type ActionProps } from "./action"
import { type PositionExpression, useController } from "./shared"

export interface FitBoundsProps extends ActionProps {
  positions: readonly PositionExpression[]
  options?: Leaflet.FitBoundsOptions
}

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
