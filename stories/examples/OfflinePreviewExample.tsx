import { WifiOff } from "lucide-react"

import { Map } from "releaf"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card"

import { Frame, home } from "./MapFrame"

import { Navigation } from "./Navigation"

const grid = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f0f5ed"/><path d="M0 0H256V256H0Z M128 0V256 M0 128H256" stroke="#c8d8bf" fill="none"/><path d="M0 60L256 190 M80 0L190 256" stroke="#fff" stroke-width="12"/></svg>')}`

export function OfflinePreviewExample({ online }: { online: boolean }) {
  return (
    <Frame
      title="Explore without tile services"
      description="Toggle Online in Storybook Controls to switch between the offline preview and live map tiles."
      tiles={online}
    >
      {!online && (
        <Map.Tiles.Custom
          url={grid}
          attribution="Local schematic grid · Not geographic map data"
        />
      )}
      <Map.Marker position={home}>
        <Map.Popup>Home in London</Map.Popup>
      </Map.Marker>
      {online ? (
        <Navigation />
      ) : (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center p-4">
          <Card
            className="pointer-events-auto w-80 max-w-full text-center"
            role="status"
          >
            <CardHeader>
              <WifiOff
                className="mx-auto mb-2 size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <CardTitle>You're offline</CardTitle>
              <CardDescription>
                This local preview is still available. Reconnect to load map
                tiles.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </Frame>
  )
}
