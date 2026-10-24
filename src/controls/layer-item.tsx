"use client"

import type { ReactNode } from "react"

export interface LayerItemProps {
  value: string
  label: ReactNode
  children: ReactNode
}

/**
 * Declares one selectable set of layers within LayerSwitcher.
 *
 * Use a unique value and a visible label. Only the active item’s children are
 * mounted, so switching items also tears down the previously selected layers.
 */
export function LayerItem({ children }: LayerItemProps) {
  return children
}
