"use client"

import type * as Leaflet from "leaflet"
import { useMap } from "../context"
import { Action, type ActionProps } from "./action"

export interface LocateProps extends ActionProps {
  options?: Leaflet.LocateOptions
}

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
