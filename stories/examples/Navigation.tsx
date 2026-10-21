import { Map } from "releaf"
import { home } from "./MapFrame"

export function Navigation() {
  return (
    <Map.Navigation
      home={home}
      zoom={14}
      locate
      positions={[home, { latitude: 51.515, longitude: -0.09 }]}
      fitOptions={{ padding: [50, 50] }}
    />
  )
}
