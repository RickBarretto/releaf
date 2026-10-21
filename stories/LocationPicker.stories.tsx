import type { Meta, StoryObj } from "@storybook/react-vite"
import { LocationPicker } from "./examples/LocationPicker"
import exampleSource from "./examples/LocationPicker.tsx?raw"

const meta = {
  title: "Map/Location Picker",
  component: LocationPicker,
  parameters: {
    controls: { disable: true },
    docs: { source: { code: exampleSource, language: "tsx", type: "code" } },
  },
} satisfies Meta<typeof LocationPicker>
export default meta
export const Complete: StoryObj<typeof meta> = {}
