import type { Meta, StoryObj } from "@storybook/react-vite"
import { LocateFixed, MapPinOff } from "lucide-react"
import { Component, type ReactNode, Suspense, useState } from "react"
import {
  type Position,
  Map as ReleafMap,
  requestCurrentLocation,
  useCurrentLocation,
} from "releaf"
import { Button } from "./components/ui/button"
import { Frame, panel } from "./examples/MapFrame"

const meta = {
  title: "Map/Current Location",
  parameters: { controls: { disable: true } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

class LocationErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    return this.state.error ? (
      <LocationDisabled
        onRequest={this.props.onRetry}
        error={this.state.error}
      />
    ) : (
      this.props.children
    )
  }
}

function LocatedPosition({ request }: { request: Promise<Position> }) {
  const position = useCurrentLocation(request)
  return (
    <>
      <ReleafMap.View position={position} zoom={16} />
      <ReleafMap.Marker position={position}>
        <ReleafMap.Popup open>Your current location</ReleafMap.Popup>
      </ReleafMap.Marker>
      <p role="status">
        {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
      </p>
    </>
  )
}

function LocationDisabled({
  onRequest,
  error,
}: {
  onRequest: () => void
  error?: Error
}) {
  return (
    <div
      className={`${panel} w-96 max-w-[80vw] space-y-4 p-8 text-center`}
      role={error ? "alert" : undefined}
    >
      <MapPinOff
        className="mx-auto size-12 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="text-3xl font-semibold tracking-tight">
        Location disabled
      </h2>
      <p className="text-sm text-muted-foreground">
        {error
          ? "We couldn’t access your location. Allow location access in your browser settings, then try again."
          : "Share your location to see where you are on the map. Your browser will ask for permission."}
      </p>
      {error && (
        <p className="text-sm text-muted-foreground">{error.message}</p>
      )}
      <Button onClick={onRequest}>
        <LocateFixed />
        {error ? "Try again" : "Enable location"}
      </Button>
    </div>
  )
}

function CurrentLocationExample() {
  const [request, setRequest] = useState<Promise<Position> | null>(null)
  const [attempt, setAttempt] = useState(0)

  function requestLocation() {
    setRequest(requestCurrentLocation())
    setAttempt((value) => value + 1)
  }

  return (
    <Frame
      title="Find your current location"
      description="Enable location to center the map on you. Requires HTTPS or localhost."
    >
      <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="pointer-events-auto">
          {request ? (
            <LocationErrorBoundary key={attempt} onRetry={requestLocation}>
              <Suspense
                fallback={
                  <div
                    className={`${panel} w-96 max-w-[80vw] space-y-3 p-8 text-center`}
                    role="status"
                  >
                    <LocateFixed
                      className="mx-auto size-12 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h2 className="text-2xl font-semibold">
                      Finding your location…
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Allow location access when your browser asks.
                    </p>
                  </div>
                }
              >
                <div className={`${panel} p-3 text-sm`}>
                  <LocatedPosition request={request} />
                </div>
              </Suspense>
            </LocationErrorBoundary>
          ) : (
            <LocationDisabled onRequest={requestLocation} />
          )}
        </div>
      </div>
    </Frame>
  )
}

export const CurrentLocation: Story = {
  render: () => <CurrentLocationExample />,
  parameters: { controls: { disable: true } },
}
