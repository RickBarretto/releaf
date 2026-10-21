import type { Meta, StoryObj } from "@storybook/react-vite"

import { ActionsExample } from "./examples/ActionsExample"

import exampleSource from "./examples/ActionsExample.tsx?raw"

const meta = {
  title: "Map/Actions",
  parameters: {
    controls: { disable: true },
    docs: { source: { code: exampleSource, language: "tsx", type: "code" } },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActionComponents: Story = {
  render: () => <ActionsExample />,
  parameters: { controls: { disable: true } },
}
