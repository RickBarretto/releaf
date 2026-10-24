export default {
  ignore: {
    // Audit maintained source, not bundled third-party code or test artifacts.
    files: [
      "dist/**",
      "website-dist/**",
      "storybook-static/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
    overrides: [
      {
        // Object.assign attaches compound children to real React components.
        files: ["src/controls.tsx"],
        rules: ["react-doctor/only-export-components"],
      },
      {
        // The wrapper only isolates propagation; its children own interactions.
        files: ["src/dsl-core/toolbar.tsx"],
        rules: ["react-doctor/no-static-element-interactions"],
      },
      {
        // setStyle updates an imperative Leaflet path, not parent React state.
        files: ["src/layers/shared.tsx"],
        rules: ["react-doctor/no-pass-live-state-to-parent"],
      },
    ],
  },
}
