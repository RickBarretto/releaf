import type { Meta, StoryObj } from "@storybook/react-vite"

import { CurrentLocationExample } from "./examples/CurrentLocationExample"

import exampleSource from "./examples/CurrentLocationExample.tsx?raw"

const meta = {
  title: "Map/Current Location",
  parameters: {
    controls: { disable: true },
    docs: { source: { code: exampleSource, language: "tsx", type: "code" } },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CurrentLocation: Story = {
  render: () => <CurrentLocationExample />,
  parameters: { controls: { disable: true } },
}
