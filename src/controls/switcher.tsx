"use client"

import { Children, isValidElement, useState } from "react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"
import type { LayerItemProps } from "./layer-item"
import { type LayerSwitcherProps, panel } from "./shared"

/**
 * Renders the LayerSwitcher buttons and mounts only the active item.
 *
 * Use value and onValueChange for controlled selection, or defaultValue for local
 * state. Without an initial value, the first item is selected.
 */
export function Switcher({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  ...props
}: LayerSwitcherProps) {
  const items = Children.toArray(children).filter(
    isValidElement<LayerItemProps>,
  )
  const [internal, setInternal] = useState(
    defaultValue ?? items[0]?.props.value,
  )
  const active = value === undefined ? internal : value
  return (
    <>
      <div
        data-slot="map-panel"
        role="toolbar"
        aria-label="Map layers"
        className={cn(panel, "flex gap-1", className)}
        {...props}
      >
        {items.map((item) => (
          <Button
            type="button"
            key={item.props.value}
            variant={active === item.props.value ? "default" : "ghost"}
            aria-pressed={active === item.props.value}
            onClick={() => {
              if (value === undefined) setInternal(item.props.value)
              onValueChange?.(item.props.value)
            }}
          >
            {item.props.label}
          </Button>
        ))}
      </div>
      {items.find((item) => item.props.value === active)}
    </>
  )
}
