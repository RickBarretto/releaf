import type { Meta, StoryObj } from "@storybook/react-vite"

import { OfflinePreviewExample } from "./examples/OfflinePreviewExample"

import exampleSource from "./examples/OfflinePreviewExample.tsx?raw"

const meta = {
  title: "Map/Offline Preview",
  component: OfflinePreviewExample,
  parameters: {
    docs: {
      source: {
        code: exampleSource,
        language: "tsx",
        type: "code",
      },
    },
  },
  args: { online: false },
  argTypes: {
    online: {
      name: "Online",
      control: "boolean",
      description: "Show live map tiles and navigation controls.",
    },
  },
} satisfies Meta<typeof OfflinePreviewExample>

export default meta

type Story = StoryObj<typeof meta>

export const OfflinePreview: Story = {}
