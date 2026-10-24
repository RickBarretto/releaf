"use client"

import type { ComponentPropsWithoutRef, ReactElement } from "react"
import { cloneElement, isValidElement } from "react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

export interface ActionProps
  extends Omit<ComponentPropsWithoutRef<"button">, "style"> {
  asChild?: boolean
}

/**
 * Composes a map action with a button or an existing React element.
 *
 * Runs the child handler, then the consumer handler, then run; preventDefault()
 * cancels subsequent steps. Child and consumer classes are merged. Without a
 * valid child element, renders the shared Button component.
 */
export function Action({
  children,
  asChild,
  onClick,
  run,
  ...props
}: ActionProps & { run: () => void }) {
  const click: NonNullable<ActionProps["onClick"]> = (event) => {
    onClick?.(event)
    if (!event.defaultPrevented) run()
  }
  if ((asChild || isValidElement(children)) && isValidElement(children)) {
    const child = children as ReactElement<ComponentPropsWithoutRef<"button">>

    return cloneElement(child, {
      ...props,
      className: cn(child.props.className, props.className),
      disabled: props.disabled ?? child.props.disabled,
      onClick: (event) => {
        child.props.onClick?.(event)
        if (
          !event.defaultPrevented &&
          !(props.disabled ?? child.props.disabled)
        )
          click(event)
      },
    })
  }

  return (
    <Button type="button" {...props} onClick={click}>
      {children}
    </Button>
  )
}
