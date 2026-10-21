import type { Meta, StoryObj } from "@storybook/react-vite"

import { CoordinatePickerExample } from "./examples/CoordinatePickerExample"

import exampleSource from "./examples/CoordinatePickerExample.tsx?raw"

const meta = {
  title: "Map/Coordinate Picker",
  parameters: {
    controls: { disable: true },
    docs: { source: { code: exampleSource, language: "tsx", type: "code" } },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CoordinatePicker: Story = {
  render: () => <CoordinatePickerExample />,
  parameters: { controls: { disable: true } },
}
