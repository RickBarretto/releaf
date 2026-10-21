import type { ReactNode } from "react"
import { Map, type Position } from "releaf"

export const home: Position = { latitude: 51.5074, longitude: -0.1278 }
export const panel =
  "rounded-xl border bg-background p-2 text-foreground shadow-lg"

export function Frame({
  children,
  title,
  description,
  zoom = 13,
  tiles = true,
}: {
  children?: ReactNode
  title: string
  description: string
  zoom?: number
  tiles?: boolean
}) {
  return (
    <section className="mx-auto max-w-6xl space-y-4 p-2">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Releaf playground
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <Map.Root
        className="demo-map relative h-[520px]"
        options={{ zoomControl: false, zoomAnimation: false }}
        fallback={<p>Loading map…</p>}
      >
        <Map.View position={home} />
        <Map.Zoom zoom={zoom} minZoom={3} maxZoom={19} />
        {tiles && <Map.Tiles.OpenStreetMap />}
        {children}
      </Map.Root>
    </section>
  )
}
