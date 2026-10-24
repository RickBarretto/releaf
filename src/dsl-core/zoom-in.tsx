"use client"

import { MapIcon } from "../components/map-icon"
import { Button } from "../components/ui/button"
import { Action, type ActionProps } from "./action"
import { useController, useZoomLimit } from "./shared"

export function ZoomIn(props: ActionProps) {
  const map = useController()
  const atLimit = useZoomLimit("max")

  return (
    <Action
      aria-label="Zoom in"
      title="Zoom in"
      {...props}
      disabled={atLimit ? true : props.disabled}
      run={() => map.zoomIn()}
    >
      {props.children ?? (
        <Button type="button" variant="ghost" size="icon">
          <MapIcon name="plus" />
        </Button>
      )}
    </Action>
  )
}
