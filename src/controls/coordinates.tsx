"use client"

import type { ComponentPropsWithoutRef } from "react"
import { useEffect, useRef, useState } from "react"
import { MapIcon } from "../components/map-icon"
import { Button } from "../components/ui/button"
import type { Position } from "../dsl-core"
import { cn } from "../lib/utils"
import { panel } from "./shared"

export interface CoordinatesProps
  extends Omit<ComponentPropsWithoutRef<"section">, "style"> {
  position: Position | null
  precision?: number
  format?: (position: Position) => string
  copy?: boolean
}

/**
 * Displays named latitude/longitude coordinates with optional clipboard copying.
 *
 * Accepts a nullable position, decimal precision, and a custom formatter.
 * Shows an empty-selection message when position is null; copy defaults to enabled.
 */
export function Coordinates({
  position,
  precision = 5,
  format,
  copy = true,
  children,
  className,
  ...props
}: CoordinatesProps) {
  const text = position
    ? format
      ? format(position)
      : `${position.latitude.toFixed(precision)}, ${position.longitude.toFixed(precision)}`
    : "No location selected"
  const [status, setStatus] = useState("")
  const version = useRef(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Changing displayed text invalidates clipboard feedback.
  useEffect(() => {
    version.current += 1
    setStatus("")
    return () => {
      version.current += 1
    }
  }, [text])
  async function copyText() {
    const id = ++version.current
    try {
      await navigator.clipboard.writeText(text)
      if (id === version.current) setStatus("Coordinates copied")
    } catch {
      if (id === version.current)
        setStatus(
          "Clipboard unavailable. Select and copy the coordinates above.",
        )
    }
  }
  return (
    <section
      data-slot="map-panel"
      className={cn(panel, "flex flex-col items-start gap-2", className)}
      {...props}
    >
      {children}
      <output className="block" aria-label="Latitude and longitude">
        {text}
      </output>
      {copy && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!position}
          onClick={copyText}
        >
          <MapIcon name="copy" />
          Copy coordinates
        </Button>
      )}
      <span role="status" className="block text-xs empty:hidden">
        {status}
      </span>
    </section>
  )
}
