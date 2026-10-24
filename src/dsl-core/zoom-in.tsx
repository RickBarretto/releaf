"use client"

import { Button } from "../components/ui/button"
import { useIcons } from "../icons"
import { Action, type ActionProps } from "./action"
import { useController, useZoomLimit } from "./shared"

/**
 * Renders Map.Actions.ZoomIn and zooms the surrounding map in by one step.
 *
 * Render inside Map.Root. Disables the action at the current maximum zoom.
 * Supply a child element to customize the button; preventDefault() cancels zooming.
 */
export function ZoomIn(props: ActionProps) {
  const icons = useIcons()
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
          {icons.plus}
        </Button>
      )}
    </Action>
  )
}
