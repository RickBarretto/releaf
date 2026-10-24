"use client"

import type * as Leaflet from "leaflet"
import { useMap } from "../context"
import { Action, type ActionProps } from "./action"

export interface LocateProps extends ActionProps {
  options?: Leaflet.LocateOptions
}

/**
 * Renders Map.Actions.Locate using Leaflet’s browser-location request.
 *
 * Render inside Map.Root. Requests setView by default; options can override it.
 * Uses Leaflet location events; use LocationControl for built-in request feedback.
 */
export function Locate({ options, ...props }: LocateProps) {
  const map = useMap()

  return (
    <Action
      aria-label="Locate me"
      title="Locate me"
      {...props}
      run={() => map.locate({ setView: true, ...options })}
    >
      {props.children ?? "Locate me"}
    </Action>
  )
}
