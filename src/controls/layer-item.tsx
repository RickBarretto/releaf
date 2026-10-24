"use client"

import type { ReactNode } from "react"

export interface LayerItemProps {
  value: string
  label: ReactNode
  children: ReactNode
}

export function LayerItem({ children }: LayerItemProps) {
  return children
}
