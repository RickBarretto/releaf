import hljs from "highlight.js/lib/core"
import css from "highlight.js/lib/languages/css"
import plaintext from "highlight.js/lib/languages/plaintext"
import typescript from "highlight.js/lib/languages/typescript"
import { Icon } from "leaflet"
import markerIcon from "leaflet/dist/images/marker-icon.png?url"
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png?url"
import markerShadow from "leaflet/dist/images/marker-shadow.png?url"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Layers,
  Leaf,
  Menu,
  Minus,
  MousePointer2,
  Plus,
  Search,
  X,
} from "lucide-react"
import { marked } from "marked"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import api from "../docs/api.md?raw"
import { CircleMarker, IconProvider, Polyline, Map as ReleafMap } from "../src"
import "leaflet/dist/leaflet.css"
import "../src/styles.css"
import "./style.css"

// Explicit URLs survive asset hashing and GitHub Pages repository subpaths.
Icon.Default.imagePath = ""
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
})

const isDocs = document.documentElement.dataset.page === "api"
const homeUrl = isDocs ? "../" : "./"
const apiUrl = isDocs ? "./" : "./api/"

// Preserve links shared before the API became a separate page.
if (!isDocs && location.hash.startsWith("#api")) {
  const section = location.hash.slice(5)
  location.replace(`${apiUrl}${section ? `#${section}` : ""}`)
}

const repo = "https://github.com/RickBarretto/releaf"
const snippets = {
  simple: `<Map.Root className="city-map">\n  <Map.View position={lisbon} zoom={13} />\n  <Map.Tiles.OpenStreetMap />\n  <Map.Marker position={lisbon}>\n    <Map.Popup>Hello, Lisbon.</Map.Popup>\n  </Map.Marker>\n</Map.Root>`,
  controls: `<Map.Root className="city-map"\n  options={{ zoomControl: false }}>\n  <Map.View position={lisbon} zoom={13} />\n  <Map.Tiles.OpenStreetMap />\n  <Map.Navigation home={lisbon} zoom={13} />\n</Map.Root>`,
  icons: `import { IconProvider, Map } from "releaf";\nimport { Plus, Minus } from "lucide-react";\n\n<IconProvider icons={{\n  plus: <Plus aria-hidden="true" strokeWidth={3} />,\n  minus: <Minus aria-hidden="true" strokeWidth={3} />,\n}}>\n  <Map.Root className="city-map"\n    options={{ zoomControl: false }}>\n    <Map.View position={lisbon} zoom={13} />\n    <Map.Tiles.OpenStreetMap />\n    <Map.Navigation />\n  </Map.Root>\n</IconProvider>`,
  picker: `<Map.Root className="city-map">\n  <Map.View position={lisbon} zoom={13} />\n  <Map.Tiles.OpenStreetMap />\n  <Map.LocationPicker\n    defaultValue={lisbon}\n    onValueChange={setPosition}\n  />\n</Map.Root>`,
}
const lisbon = { latitude: 38.713, longitude: -9.139 }
function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState("Copy")
  useEffect(() => {
    if (state !== "Copy") {
      const timer = setTimeout(() => setState("Copy"), 2200)
      return () => clearTimeout(timer)
    }
  }, [state])
  return (
    <button
      type="button"
      className="copy"
      aria-label={state}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setState("Copied")
        } catch {
          setState("Copy unavailable")
        }
      }}
    >
      {state === "Copied" ? <Check size={14} /> : <Copy size={14} />}
      <span aria-live="polite">{state}</span>
    </button>
  )
}
function Code({ value, label = "tsx" }: { value: string; label?: string }) {
  return (
    <div className="code">
      <div className="code-heading">
        <span>
          <i /> {label}
        </span>
        <CopyButton value={value} />
      </div>
      <pre>
        <code>
          {value
            .split(
              /("[^"\n]*"|<\/?[A-Za-z.]+|\b(?:import|from|const|export|return)\b)/g,
            )
            .map((part, i) => (
              <span
                /* biome-ignore lint/suspicious/noArrayIndexKey: Static syntax tokens have no state. */
                key={i}
                className={
                  part.startsWith('"')
                    ? "string"
                    : part.startsWith("<")
                      ? "tag"
                      : ""
                }
              >
                {part}
              </span>
            ))}
        </code>
      </pre>
    </div>
  )
}
const headings = [...api.matchAll(/^## (.+)$/gm)].map((match) => ({
  title: match[1],
  id: slug(match[1]),
}))
function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
}
const renderer = new marked.Renderer()
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("css", css)
hljs.registerLanguage("plaintext", plaintext)
renderer.code = ({ text, lang }) => {
  const language = lang?.split(/\s+/)[0] ?? "plaintext"
  const highlighted = hljs.getLanguage(language)
    ? hljs.highlight(text, { language }).value
    : hljs.highlight(text, { language: "plaintext" }).value
  return `<pre><code class="hljs">${highlighted}</code></pre>\n`
}
renderer.heading = ({ tokens, depth, text }) => {
  const id = slug(text)
  if (depth > 2) {
    return `<h${depth} id="${id}">${marked.Parser.parseInline(tokens)}</h${depth}>`
  }
  return `<h${depth} id="${id}">${marked.Parser.parseInline(tokens)} <a class="heading-anchor" href="#${id}" aria-label="Link to ${id.replaceAll("-", " ")}"><span aria-hidden="true">#</span></a></h${depth}>`
}
renderer.link = ({ href, tokens }) => {
  if (href.startsWith("../")) href = `${repo}/blob/main/${href.slice(3)}`
  return `<a href="${href}">${marked.Parser.parseInline(tokens)}</a>`
}
const docsHtml = marked.parse(api.replace("[← README](../README.md)", ""), {
  renderer,
}) as string
function Docs() {
  const [query, setQuery] = useState("")
  return (
    <div className="docs-layout">
      <aside>
        <div className="eyebrow">THE FIELD GUIDE</div>
        <label className="doc-search">
          <Search size={16} />
          <input
            aria-label="Filter API sections"
            placeholder="Find a section…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <nav aria-label="API sections">
          {headings
            .filter((h) => h.title.toLowerCase().includes(query.toLowerCase()))
            .map((h) => (
              <a key={h.id} href={`#${h.id}`}>
                {h.title}
                <ArrowUpRight size={13} />
              </a>
            ))}
          {query &&
            !headings.some((h) =>
              h.title.toLowerCase().includes(query.toLowerCase()),
            ) && <p>No sections found.</p>}
        </nav>
        <a className="source-link" href={`${repo}/blob/main/docs/api.md`}>
          Edit this guide ↗
        </a>
      </aside>
      <article
        className="prose"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: Only repository-owned Markdown is rendered, with no user input. */
        dangerouslySetInnerHTML={{ __html: docsHtml }}
      />
    </div>
  )
}
function Landing() {
  const [example, setExample] = useState<keyof typeof snippets>("simple")
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> A FRESH TAKE ON REACT MAPS
          </div>
          <h1>
            Maps,
            <br />
            <em>naturally.</em>
          </h1>
          <p>
            Your components. Your controls. A lean, typed React wrapper for
            Leaflet that makes mapping feel like second nature.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={`${apiUrl}#setup`}>
              Start building <ArrowRight size={17} />
            </a>
            <a className="text-link" href={repo}>
              Explore the source <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="install">
            <span>$</span>
            <code>bun add releaf leaflet</code>
            <CopyButton value="bun add releaf leaflet react react-dom" />
          </div>
          <div className="compat">
            React 19.2+ <span>·</span> Leaflet 1.9.4 <span>·</span> TypeScript
          </div>
        </div>
        <div className="map-frame">
          <div className="map-title">
            <span>
              <span className="status-dot" /> THE WORLD IS YOUR CANVAS
            </span>
            <span>38°43′ N &nbsp; 9°08′ W</span>
          </div>
          <div className="map-demo">
            <ReleafMap.Root
              className="hero-map"
              aria-label="Interactive map of Lisbon"
              options={{ zoomControl: false, scrollWheelZoom: false }}
            >
              <ReleafMap.View position={lisbon} zoom={13} />
              <ReleafMap.Tiles.OpenStreetMap />
              <ReleafMap.Navigation top right home={lisbon} zoom={13} />
              <Polyline
                positions={[
                  [38.727, -9.155],
                  [38.721, -9.149],
                  [38.715, -9.141],
                  [38.711, -9.133],
                  [38.707, -9.136],
                ]}
                pathOptions={{ color: "#315b42", weight: 4, dashArray: "6 8" }}
              />
              {[
                [38.727, -9.155],
                [38.715, -9.141],
                [38.707, -9.136],
              ].map(([lat, lng], i) => (
                <CircleMarker
                  key={lat}
                  center={[lat, lng]}
                  radius={8}
                  pathOptions={{
                    color: "#fff",
                    weight: 3,
                    fillColor: "#315b42",
                    fillOpacity: 1,
                  }}
                >
                  <ReleafMap.Popup>
                    {
                      [
                        "A new perspective",
                        "Hello, Lisbon.",
                        "A little further",
                      ][i]
                    }
                  </ReleafMap.Popup>
                </CircleMarker>
              ))}
            </ReleafMap.Root>
            <div className="map-note">
              <span className="note-icon">
                <Leaf size={21} />
              </span>
              <div>
                <strong>A little room to explore.</strong>
                <span>Drag the map. Find your own way.</span>
              </div>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="map-bottom">
            <span>
              <MousePointer2 size={12} /> LIVE MAP · BUILT WITH RELEAF
            </span>
            <span>LISBON, PORTUGAL</span>
          </div>
        </div>
      </section>
      <section className="principles">
        <div>
          <Layers />
          <span>Compose, don’t configure.</span>
        </div>
        <div>
          <Code2 />
          <span>Typed from root to leaf.</span>
        </div>
        <div>
          <MousePointer2 />
          <span>Your UI. Fully in control.</span>
        </div>
      </section>
      <section className="build-section" id="examples">
        <div className="section-intro">
          <div className="eyebrow">SMALL API. OPEN POSSIBILITIES.</div>
          <h2>
            A map is just
            <br />
            the beginning.
          </h2>
          <p>
            Start with a few components. Grow into search, location pickers, and
            custom controls — without leaving React.
          </p>
          <a className="text-link" href={apiUrl}>
            Meet the whole API <ArrowRight size={16} />
          </a>
          <div className="example-tabs">
            {(
              [
                ["simple", "01", "A place to start"],
                ["controls", "02", "Make it your own"],
                ["picker", "03", "Pick a location"],
                ["icons", "04", "Bring your own icons"],
              ] as const
            ).map(([key, number, title]) => (
              <button
                type="button"
                key={key}
                aria-pressed={example === key}
                onClick={() => setExample(key)}
              >
                <span>{number}</span>
                {title}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </div>
        <div className="example-code">
          <div className="example-live">
            <div className="example-live-label">
              <span className="status-dot" /> LIVE EXAMPLE ·{" "}
              {example === "picker"
                ? "CLICK THE MAP OR DRAG THE MARKER"
                : example === "controls" || example === "icons"
                  ? "TRY THE NAVIGATION CONTROLS"
                  : "CLICK THE MARKER"}
            </div>
            <ReleafMap.Root
              key={example}
              className="example-map"
              aria-label={`${example} live ReLeaf example`}
              options={{ zoomControl: false, scrollWheelZoom: false }}
            >
              <ReleafMap.View position={lisbon} zoom={13} />
              <ReleafMap.Tiles.OpenStreetMap />
              {example === "simple" && (
                <ReleafMap.Marker position={lisbon}>
                  <ReleafMap.Popup>Hello, Lisbon.</ReleafMap.Popup>
                </ReleafMap.Marker>
              )}
              {example === "controls" && (
                <ReleafMap.Navigation home={lisbon} zoom={13} />
              )}
              {example === "icons" && (
                <IconProvider
                  icons={{
                    plus: <Plus aria-hidden="true" strokeWidth={3} />,
                    minus: <Minus aria-hidden="true" strokeWidth={3} />,
                  }}
                >
                  <ReleafMap.Navigation />
                </IconProvider>
              )}
              {example === "picker" && (
                <ReleafMap.LocationPicker defaultValue={lisbon} />
              )}
            </ReleafMap.Root>
          </div>
          <Code value={snippets[example]} label="your-next-map.tsx" />
          <p>
            <span className="status-dot" /> Declarative components. Real Leaflet
            underneath.
          </p>
          <small>
            Examples use{" "}
            <code>lisbon = {"{ latitude: 38.713, longitude: -9.139 }"}</code>
            {example === "picker" && " and a React state setter, setPosition."}{" "}
            Set .city-map to a visible height.
            {example === "icons" && (
              <>
                {" "}
                Use Phosphor, Lucide, or your preferred library.{" "}
                <a href={`${apiUrl}#icons`}>See all icon slots ↗</a>
              </>
            )}
          </small>
        </div>
      </section>
      <section className="feature-section">
        <div className="eyebrow">ROOTED IN THE TOOLS YOU LOVE</div>
        <h2>
          Fits your stack.
          <br />
          <em>Follows your lead.</em>
        </h2>
        <div className="feature-grid">
          <div>
            <span>01 / COMPOSITION</span>
            <h3>Bring your own buttons.</h3>
            <p>
              Built-in shadcn/ui controls, or your own components. Wrap a button
              with a map action and let ReLeaf handle the rest. Bring your own
              Phosphor, Lucide, or other icons with IconProvider.
            </p>
            <a href={`${apiUrl}#controls`}>Explore controls ↗</a>
          </div>
          <div>
            <span>02 / FLEXIBILITY</span>
            <h3>Your provider. Your places.</h3>
            <p>
              Use OpenStreetMap tiles or your own tile source. Connect search to
              your provider with a simple, cancellable function.
            </p>
            <a href={`${apiUrl}#search`}>Explore search ↗</a>
          </div>
          <div>
            <span>03 / REACT FIRST</span>
            <h3>Stay in your element.</h3>
            <p>
              Typed hooks, live refs, and client-loaded Leaflet. Keep your
              application in React while reaching for native map APIs when you
              need them.
            </p>
            <a href={`${apiUrl}#hooks`}>Explore hooks ↗</a>
          </div>
        </div>
      </section>
      <section className="closing">
        <Leaf size={32} />
        <h2>
          Put your next idea
          <br />
          <em>on the map.</em>
        </h2>
        <a href={`${apiUrl}#setup`} className="button primary">
          Plant the first component <ArrowRight size={17} />
        </a>
      </section>
    </>
  )
}
function App() {
  const [hash, setHash] = useState(location.hash)
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    const update = () => {
      setHash(location.hash)
      setMenu(false)
    }
    addEventListener("hashchange", update)
    return () => removeEventListener("hashchange", update)
  }, [])
  useEffect(() => {
    document.title = isDocs
      ? "API reference — ReLeaf"
      : "ReLeaf — Maps, naturally."
    const target = decodeURIComponent(hash.slice(1))
    requestAnimationFrame(() => {
      const el = document.getElementById(target)
      if (el) el.scrollIntoView()
      else window.scrollTo(0, 0)
    })
  }, [hash])
  return (
    <>
      <button
        type="button"
        className="skip"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById("main")?.focus()
          document.getElementById("main")?.scrollIntoView()
        }}
      >
        Skip to content
      </button>
      <header>
        <a className="brand" href={homeUrl} aria-label="ReLeaf home">
          <span className="brand-icon">
            <Leaf size={20} />
          </span>
          <span>
            {"{Re}"}
            <b>Leaf</b>
            <sup>{__WEBSITE_VERSION__}</sup>
          </span>
        </a>
        <button
          type="button"
          className="mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav className={menu ? "open" : ""} aria-label="Main navigation">
          <a href={apiUrl} aria-current={isDocs ? "page" : undefined}>
            Documentation
          </a>
          <a href={`${homeUrl}#examples`}>Examples</a>
          <a href={repo}>
            <Code2 size={16} /> GitHub <ArrowUpRight size={13} />
          </a>
          <a className="nav-cta" href={`${apiUrl}#setup`}>
            Get started <ArrowRight size={15} />
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {isDocs ? <Docs /> : <Landing />}
      </main>
      <footer>
        <a className="brand" href={homeUrl}>
          <Leaf size={20} />
          <span>
            {"{Re}"}
            <b>Leaf</b>
          </span>
        </a>
        <span className="footer-copyright">
          A little less boilerplate. A little more possibility.
        </span>
        <a href="https://github.com/RickBarretto">Made by RickBarretto ↗</a>
      </footer>
    </>
  )
}

const root = document.getElementById("root")
if (root) createRoot(root).render(<App />)
