"use client"

import type * as Leaflet from "leaflet"
import type { ReactNode } from "react"
import { MapIcon } from "../components/map-icon"
import { Button } from "../components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip"
import type { PositionExpression, ToolbarProps } from "../dsl-core"
import { MapPrimitives as ReleafMap } from "../dsl-core"
import { cn } from "../lib/utils"
import { LocationControl } from "./location-control"
import { panel } from "./shared"

export interface NavigationProps extends ToolbarProps {
  orientation?: "vertical" | "horizontal"
  home?: PositionExpression
  zoom?: number
  locate?: boolean
  positions?: readonly PositionExpression[]
  fitOptions?: Leaflet.FitBoundsOptions
}

export function Navigation({
  orientation = "vertical",
  home,
  zoom,
  locate = false,
  positions,
  fitOptions,
  children,
  className,
  ...props
}: NavigationProps) {
  function tip(label: string, child: ReactNode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{child}</TooltipTrigger>
        <TooltipContent className="z-[1100]">{label}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <ReleafMap.Toolbar {...props}>
      <TooltipProvider>
        <div
          data-slot="map-panel"
          className={cn(
            panel,
            "flex gap-1",
            orientation === "vertical" && "flex-col",
            className,
          )}
        >
          {children ?? (
            <>
              {tip("Zoom in", <ReleafMap.Actions.ZoomIn />)}
              {tip("Zoom out", <ReleafMap.Actions.ZoomOut />)}
              {home &&
                tip(
                  "Go home",
                  <ReleafMap.Actions.FlyTo
                    position={home}
                    zoom={zoom}
                    aria-label="Go home"
                    title="Go home"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Go home"
                      title="Go home"
                    >
                      <MapIcon name="pin" />
                    </Button>
                  </ReleafMap.Actions.FlyTo>,
                )}
              {locate && <LocationControl compact recenter zoom={zoom} />}
              {positions &&
                tip(
                  "Fit markers",
                  <ReleafMap.Actions.FitBounds
                    positions={positions}
                    options={fitOptions}
                  >
                    <Button type="button" variant="ghost" size="icon">
                      <MapIcon name="fit" />
                    </Button>
                  </ReleafMap.Actions.FitBounds>,
                )}
            </>
          )}
        </div>
      </TooltipProvider>
    </ReleafMap.Toolbar>
  )
}
