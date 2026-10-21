import { home } from "./MapFrame"

export const places = [
  { id: "home", label: "London · City center", ...home },
  {
    id: "paris",
    label: "Paris · Eiffel Tower",
    latitude: 48.8584,
    longitude: 2.2945,
  },
  {
    id: "sao-paulo",
    label: "São Paulo · Avenida Paulista",
    latitude: -23.5614,
    longitude: -46.6559,
  },
  {
    id: "rio",
    label: "Rio de Janeiro · Copacabana",
    latitude: -22.9711,
    longitude: -43.1822,
  },
]
