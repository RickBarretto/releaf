import { execFileSync } from "node:child_process"

export default function setup() {
  // Published-entrypoint checks also run when tests are launched from VS Code.
  execFileSync("bun", ["run", "build"], { stdio: "inherit" })
}
