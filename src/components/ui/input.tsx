"use client"

import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

export function Input({
  className,
  type,
  ...props
}: Omit<ComponentProps<"input">, "style">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
