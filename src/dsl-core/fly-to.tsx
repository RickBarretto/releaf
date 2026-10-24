"use client"

import type * as Leaflet from "leaflet"
import { Action, type ActionProps } from "./action"
import { type PositionExpression, useController } from "./shared"

export interface FlyToProps extends ActionProps {
  position: PositionExpression
  zoom?: number
  options?: Leaflet.ZoomPanOptions
}

export function FlyTo({ position, zoom, options, ...props }: FlyToProps) {
  const map = useController()

  return (
    <Action
      aria-label="Go to location"
      title="Go to location"
      {...props}
      run={() =>
        map.flyTo(position, zoom, {
          ...options,
          animate:
            options?.animate !== false &&
            !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
        })
      }
    >
      {props.children ?? "Go to location"}
    </Action>
  )
}
