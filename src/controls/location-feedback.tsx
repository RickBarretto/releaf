"use client"

import type { ComponentPropsWithoutRef } from "react"
import { MapIcon } from "../components/map-icon"
import { Button } from "../components/ui/button"
import { MapPrimitives as ReleafMap } from "../dsl-core"
import { cn } from "../lib/utils"
import { panel } from "./shared"

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
  return (
    <>
      <Button
        {...buttonProps}
        type="button"
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "icon" : "default"}
        aria-label={
          compact
            ? error
              ? "Retry current location"
              : "Locate me"
            : buttonProps?.["aria-label"]
        }
        title={
          compact
            ? status === "pending"
              ? "Finding your location…"
              : error
                ? "Retry current location"
                : "Locate me"
            : buttonProps?.title
        }
        aria-busy={status === "pending"}
        disabled={status === "pending" || buttonProps?.disabled}
        onClick={request}
      >
        <MapIcon name="locate" />
        {!compact &&
          (status === "pending"
            ? "Finding your location…"
            : error
              ? "Retry current location"
              : "Use current location")}
      </Button>
      {compact ? (
        (status === "pending" || error) && (
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
      ) : (
        <>
          <span role="status" className="block text-xs empty:hidden">
            {status === "pending"
              ? "Allow location access when your browser asks."
              : ""}
          </span>
          {error && (
            <p role="alert" className="m-0 text-sm">
              {error.message} You can still search or choose on the map.
            </p>
          )}
        </>
      )}
    </>
  )
}
