import type { Meta, StoryObj } from "@storybook/react-vite"
import { Map as ReleafMap } from "releaf"
import { Frame, home } from "./examples/MapFrame"
import { Navigation } from "./examples/Navigation"

function Playground({ zoom }: { zoom: number }) {
  return (
    <Frame
      title="Your map, your controls"
      description="Pan the map, open a marker, or try the navigation toolbar. Adjust zoom in Storybook Controls."
      zoom={zoom}
    >
      <ReleafMap.Marker position={home}>
        <ReleafMap.Popup>
          <strong>Home</strong>
          <p>London, United Kingdom</p>
        </ReleafMap.Popup>
      </ReleafMap.Marker>
      <ReleafMap.Marker position={{ latitude: 51.515, longitude: -0.09 }}>
        <ReleafMap.Popup>Another stop</ReleafMap.Popup>
      </ReleafMap.Marker>
      <Navigation />
    </Frame>
  )
}
const meta = {
  title: "Map/Navigation",
  component: Playground,
  args: { zoom: 13 },
  argTypes: {
    zoom: { control: { type: "range", min: 3, max: 19, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Interactive examples of the compound Map API with development-only shadcn/ui buttons. Map tiles require internet access. Geolocation requires browser permission and a secure context (localhost works).",
      },
    },
  },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>
export const NavigationPlayground: Story = {}
