// Vite is the development server of the simulator: it serves the page built from src/ and reloads the browser when a source file changes.
// (The released file is built by tools/build/build.js: one html that works without internet. Both give the same page.)
import { defineConfig } from 'vite'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.dirname(fileURLToPath(import.meta.url))
function simulator() {
  let html = null
  const build = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logicsim-dev-'))
    execFileSync('node', [path.join(root, 'tools/build/build.js'), '--out', dir], { cwd: root, stdio: 'pipe' })
    html = fs.readFileSync(path.join(dir, fs.readdirSync(dir).find((f) => /^logic-sim-v.*\.html$/.test(f))), 'utf8')
    fs.rmSync(dir, { recursive: true, force: true })
  }
  return {
    name: 'logic-sim',
    configureServer(server) {
      const watch = ['src', 'tools/shell', 'tools/hmi', 'tools/theme', 'tools/uat'].map((p) => path.join(root, p))
      server.watcher.add(watch)
      server.watcher.on('all', (ev, file) => {
        if (watch.some((w) => file.startsWith(w))) { html = null; server.ws.send({ type: 'full-reload' }) }
      })
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url.startsWith('/index.html') || req.url.startsWith('/?')) {
          if (!html) build()
          res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(html); return
        }
        next()
      })
    },
  }
}
export default defineConfig({ root, plugins: [simulator()], server: { port: 5173, strictPort: false }, appType: 'custom' })
