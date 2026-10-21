import type { Meta, StoryObj } from "@storybook/react-vite"

import { Playground } from "./examples/NavigationExample"

import exampleSource from "./examples/Navigation.tsx?raw"

const meta = {
  title: "Map/Navigation",
  component: Playground,
  args: { zoom: 13 },
  argTypes: {
    zoom: { control: { type: "range", min: 3, max: 19, step: 1 } },
  },
  parameters: {
    docs: {
      source: {
        code: exampleSource,
        language: "tsx",
        type: "code",
      },
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
