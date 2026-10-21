import type { Meta, StoryObj } from "@storybook/react-vite"
import { LocationPicker } from "./examples/LocationPicker"

const meta = {
  title: "Map/Location Picker",
  component: LocationPicker,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof LocationPicker>
export default meta
export const Complete: StoryObj<typeof meta> = {}
