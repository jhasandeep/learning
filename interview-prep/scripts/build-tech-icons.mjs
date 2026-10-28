// Copies the Devicon logos (MIT, https://devicon.dev) used across the app into
// public/icons/tech/<name>.svg. They are served as static images, so pages
// that show many logos ship no extra JavaScript and the browser caches them.
//
//   npm run icons
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public/icons/tech')

// Devicon name → file variant. Keep in sync with src/components/tech-icon.tsx.
const ICONS = {
  python: 'original', r: 'original', sqlite: 'original', html5: 'original', css3: 'original', java: 'original',
  kotlin: 'original', c: 'original', cplusplus: 'original', csharp: 'original', javascript: 'original',
  typescript: 'original', go: 'original', rust: 'original', scala: 'original', dart: 'original', ruby: 'original',
  php: 'original', swift: 'original', react: 'original', nextjs: 'original', nodejs: 'original', express: 'original',
  postgresql: 'original', mongodb: 'original', git: 'original', docker: 'original', jest: 'plain', nestjs: 'original',
  django: 'plain', fastapi: 'original',
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const [name, variant] of Object.entries(ICONS)) {
  const svg = readFileSync(join(root, 'node_modules/devicon/icons', name, `${name}-${variant}.svg`), 'utf8')
    .replace(/<\?xml[^>]*>|<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  writeFileSync(join(out, `${name}.svg`), svg)
}
console.log(`wrote ${Object.keys(ICONS).length} logos to public/icons/tech`)
