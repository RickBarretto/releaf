import type { Meta, StoryObj } from "@storybook/react-vite"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const meta = {
  title: "Development/Button",
  component: Button,
  args: {
    children: "Go home",
    title: "Go home",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    title: { control: "text", description: "Custom button tooltip." },
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost"],
    },
    size: { control: "select", options: ["default", "sm", "icon"] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "The local shadcn/ui Button used by the map examples. This component, Radix Slot, Tailwind CSS, and Lucide are development-only and are not part of Releaf's published API.",
      },
    },
  },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button title="Default action">Default</Button>
      <Button variant="secondary" title="Secondary action">
        Secondary
      </Button>
      <Button variant="outline" title="Outline action">
        Outline
      </Button>
      <Button variant="ghost" title="Ghost action">
        Ghost
      </Button>
      <Button disabled title="Disabled action">
        Disabled
      </Button>
    </div>
  ),
}
export const Icon: Story = {
  args: {
    size: "icon",
    "aria-label": "Zoom in",
    title: "Zoom in",
    children: <Plus />,
  },
}
export const CustomTooltip: Story = {
  args: { children: "Go home", title: "Reset the map to its starting view" },
}
