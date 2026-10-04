import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

function run(cwd, command, args) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env
  });
  child.on("exit", (code) => {
    if (code && code !== 0) process.exit(code);
  });
  return child;
}

const api = run(path.join(root, "backend"), "node", ["src/index.js"]);
const web = run(path.join(root, "frontend"), "npx", ["vite", "--host", "0.0.0.0", "--port", "5173"]);

function shutdown() {
  api.kill("SIGTERM");
  web.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
