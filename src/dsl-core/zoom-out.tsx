"use client"

import { MapIcon } from "../components/map-icon"
import { Button } from "../components/ui/button"
import { Action, type ActionProps } from "./action"
import { useController, useZoomLimit } from "./shared"

/**
 * Renders Map.Actions.ZoomOut and zooms the surrounding map out by one step.
 *
 * Render inside Map.Root. Disables the action at the current minimum zoom.
 * Supply a child element to customize the button; preventDefault() cancels zooming.
 */
export function ZoomOut(props: ActionProps) {
  const map = useController()
  const atLimit = useZoomLimit("min")

  return (
    <Action
      aria-label="Zoom out"
      title="Zoom out"
      {...props}
      disabled={atLimit ? true : props.disabled}
      run={() => map.zoomOut()}
    >
      {props.children ?? (
        <Button type="button" variant="ghost" size="icon">
          <MapIcon name="minus" />
        </Button>
      )}
    </Action>
  )
}
