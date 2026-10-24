"use client"

import { Button } from "../components/ui/button"
import { useIcons } from "../icons"
import { Action, type ActionProps } from "./action"
import { useController, useZoomLimit } from "./shared"

/**
 * Renders Map.Actions.ZoomOut and zooms the surrounding map out by one step.
 *
 * Render inside Map.Root. Disables the action at the current minimum zoom.
 * Supply a child element to customize the button; preventDefault() cancels zooming.
 */
export function ZoomOut(props: ActionProps) {
  const icons = useIcons()
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
          {icons.minus}
        </Button>
      )}
    </Action>
  )
}
