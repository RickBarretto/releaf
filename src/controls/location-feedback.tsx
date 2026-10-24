"use client"

import type { ComponentPropsWithoutRef } from "react"
import { Button } from "../components/ui/button"
import { MapPrimitives as ReleafMap } from "../dsl-core"
import { useIcons } from "../icons"
import { cn } from "../lib/utils"
import { panel } from "./shared"

function LocationStatus({
  pending,
  error,
  compact,
}: {
  pending: boolean
  error: Error | null
  compact: boolean
}) {
  if (compact) {
    if (!pending && !error) return null
    return (
      <ReleafMap.Toolbar bottom left>
        <div
          data-slot="map-panel"
          className={cn(panel, "w-64 max-w-[calc(100vw-2rem)] text-sm")}
          role={error ? "alert" : "status"}
        >
          {error
            ? `${error.message} Use Locate me to try again.`
            : "Finding your location… Allow location access when your browser asks."}
        </div>
      </ReleafMap.Toolbar>
    )
  }
  return (
    <>
      <span role="status" className="block text-xs empty:hidden">
        {pending ? "Allow location access when your browser asks." : ""}
      </span>
      {error && (
        <p role="alert" className="m-0 text-sm">
          {error.message} You can still search or choose on the map.
        </p>
      )}
    </>
  )
}

/**
 * Renders the shared current-location button, pending status, and error feedback.
 *
 * The caller owns the request state and request callback. Pending requests disable
 * the button; compact mode places feedback in a bottom-left map toolbar.
 */
export function LocationFeedback({
  status,
  error,
  request,
  compact = false,
  buttonProps,
}: {
  buttonProps?: Omit<
    ComponentPropsWithoutRef<"button">,
    "onClick" | "children" | "style"
  >
  compact?: boolean
  status: string
  error: Error | null
  request: () => void
}) {
  const icons = useIcons()
  const pending = status === "pending"
  const actionLabel = error ? "Retry current location" : "Locate me"
  const progressLabel = pending ? "Finding your location…" : actionLabel
  return (
    <>
      <Button
        {...buttonProps}
        type="button"
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "icon" : "default"}
        aria-label={compact ? actionLabel : buttonProps?.["aria-label"]}
        title={compact ? progressLabel : buttonProps?.title}
        aria-busy={pending}
        disabled={pending || buttonProps?.disabled}
        onClick={request}
      >
        {icons.locate}
        {!compact &&
          (pending
            ? "Finding your location…"
            : error
              ? "Retry current location"
              : "Use current location")}
      </Button>
      <LocationStatus pending={pending} error={error} compact={compact} />
    </>
  )
}
