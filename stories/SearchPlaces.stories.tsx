import type { Meta, StoryObj } from "@storybook/react-vite"

import { SearchPlacesExample } from "./examples/SearchPlacesExample"

import exampleSource from "./examples/SearchPlacesExample.tsx?raw"

const meta = {
  title: "Map/Search Places",
  parameters: {
    controls: { disable: true },
    docs: { source: { code: exampleSource, language: "tsx", type: "code" } },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const SearchPlaces: Story = {
  render: () => <SearchPlacesExample />,
  parameters: { controls: { disable: true } },
}
