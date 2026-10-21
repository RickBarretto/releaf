import type { Meta, StoryObj } from "@storybook/react-vite"

import { LayerSwitcherExample } from "./examples/LayerSwitcherExample"

import exampleSource from "./examples/LayerSwitcherExample.tsx?raw"

const meta = {
  title: "Map/Layer Switcher",
  parameters: {
    controls: { disable: true },
    docs: { source: { code: exampleSource, language: "tsx", type: "code" } },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const LayerSwitcher: Story = {
  render: () => <LayerSwitcherExample />,
  parameters: { controls: { disable: true } },
}
