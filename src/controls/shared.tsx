"use client"

import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { createContext, useContext } from "react"
import type { Position } from "../dsl-core"
import type { useLocationRequest } from "../location"

export const panel =
  "rounded-xl border border-border bg-background p-2 text-foreground shadow-lg"

export const motion = () =>
  !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

export interface LayerSwitcherProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "style" | "defaultValue" | "onChange"
  > {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export type SelectionSource =
  | "Initial location"
  | "Map click"
  | "Marker drag"
  | "Search result"
  | "Current location"
  | "External value"

export interface SelectionDetails {
  source: SelectionSource
}

export interface LocationPickerProps {
  value?: Position | null
  defaultValue?: Position | null
  onValueChange?: (value: Position | null, details: SelectionDetails) => void
  children?: ReactNode
  zoom?: number
  locationOptions?: PositionOptions
}

export interface PickerState {
  value: Position | null
  source: SelectionSource
  select: (
    position: Position | null,
    source?: SelectionSource,
    recenter?: boolean,
  ) => void
  locate: () => Promise<void>
  status: ReturnType<typeof useLocationRequest>["status"]
  error: Error | null
}

export const PickerContext = createContext<PickerState | null>(null)

export function useLocationPicker() {
  const state = useContext(PickerContext)
  if (!state)
    throw new Error("useLocationPicker must be inside Map.LocationPicker")
  return state
}
