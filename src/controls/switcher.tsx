"use client"

import type { ReactNode } from "react"
import { Children, Fragment, isValidElement, useState } from "react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"
import type { LayerItemProps } from "./layer-item"
import {
  type LayerSwitcherOption,
  type LayerSwitcherProps,
  panel,
} from "./shared"

/**
 * Renders the LayerSwitcher buttons and mounts only the active item.
 *
 * Use value and onValueChange for controlled selection, or defaultValue for local
 * state. Without an initial value, the first item is selected.
 */
export function Switcher<const Value extends string>(
  config: Extract<
    LayerSwitcherProps<Value>,
    { options: readonly LayerSwitcherOption<Value>[] }
  >,
): ReactNode
export function Switcher(
  config: Extract<LayerSwitcherProps, { options?: never }>,
): ReactNode

export function Switcher<const Value extends string = string>(
  config: LayerSwitcherProps<Value>,
) {
  const {
    value,
    defaultValue,
    onValueChange: _onValueChange,
    options,
    children,
    className,
    ...props
  } = config
  const items =
    options ??
    Children.toArray(children)
      .filter(isValidElement<LayerItemProps>)
      .map((item) => ({
        value: item.props.value,
        label: item.props.label,
        layer: item,
      }))
  const values = new Set<string>()
  for (const item of items) {
    if (values.has(item.value)) {
      throw new Error(`LayerSwitcher values must be unique: "${item.value}"`)
    }
    values.add(item.value)
  }
  const [internal, setInternal] = useState<string | undefined>(defaultValue)
  const requested = value === undefined ? internal : value
  const active = items.find((item) => item.value === requested) ?? items[0]
  if (value === undefined && internal !== active?.value) {
    setInternal(active?.value)
  }
  function select(next: string) {
    if (value === undefined) setInternal(next)
    if (config.options) {
      const option = config.options.find((item) => item.value === next)
      if (option) config.onValueChange?.(option.value)
    } else {
      config.onValueChange?.(next)
    }
  }
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
            key={item.value}
            variant={active === item ? "default" : "ghost"}
            aria-pressed={active === item}
            onClick={() => select(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {active && <Fragment key={active.value}>{active.layer}</Fragment>}
    </>
  )
}
