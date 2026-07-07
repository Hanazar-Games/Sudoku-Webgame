import { copyFile, mkdir } from 'node:fs/promises'

const files = [
  ['dist/assets/app.css', 'assets/app.css'],
  ['dist/assets/main.js', 'assets/main.js'],
  ['dist/favicon.svg', 'favicon.svg'],
  ['dist/manifest.json', 'manifest.json'],
]

await mkdir('assets', { recursive: true })

await Promise.all(files.map(([from, to]) => copyFile(from, to)))
