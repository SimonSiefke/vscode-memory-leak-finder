#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const partsDir = path.join(repoRoot, 'packages', 'memory-leak-finder', 'src', 'parts')

/** @param {string} name */
const guessTargets = (name) => {
  const id = name.toLowerCase()

  // browser + worker
  if (id.includes('offscreencanvas') || id.includes('messageport')) {
    return ['browser', 'webworker']
  }

  // browser only indicators
  const browserOnlyTokens = [
    'dom',
    'css',
    'styleelement',
    'iframe',
    'mediaquery',
    'eventlistener',
    'eventlisteners',
    'eventtarget',
    'detacheddom',
    'attacheddom',
    'minimap',
    'widget',
    'resizeobserver',
    'intersectionobserver',
    'mutationobserver',
    'windowcount',
    'editcontext',
    'canvas',
    'workercount',
    'worker',
  ]
  if (browserOnlyTokens.some((t) => id.includes(t))) {
    return ['browser']
  }

  // default to universal
  return ['browser', 'node', 'webworker']
}

/** @param {string} content */
const ensureImport = (content) => {
  if (/from '\.\.\/TargetId\/TargetId\.ts'/.test(content)) return content
  const importLine = "import * as TargetId from '../TargetId/TargetId.ts'\n"
  const importBlockMatch = content.match(/^(?:import .*\n)+/)
  if (importBlockMatch) {
    const idx = importBlockMatch[0].length
    return content.slice(0, idx) + importLine + content.slice(idx)
  }
  return importLine + content
}

/** @param {string} file */
const updateFile = (file) => {
  let content = fs.readFileSync(file, 'utf8')

  // Replace existing string-based targets
  const stringTargetsRegex = /export\s+const\s+targets\s*=\s*\[([^\]]*)\]/
  const m = content.match(stringTargetsRegex)
  if (m) {
    const inner = m[1]
    const items = inner
      .split(',')
      .map((s) => s.trim().replace(/^'|"|`|\s+|,$/g, ''))
      .filter(Boolean)
    const mapped = items.map((t) => (t.includes('browser') ? 'TargetId.Browser' : t.includes('node') ? 'TargetId.Node' : 'TargetId.Worker'))
    content = content.replace(stringTargetsRegex, `export const targets = [${mapped.join(', ')}]`)
    content = ensureImport(content)
    fs.writeFileSync(file, content)
    return true
  }

  if (/export\s+const\s+targets\s*=/.test(content) || /export\s+const\s+target\s*=/.test(content)) {
    // already has numeric or legacy target(s)
    return false
  }

  const dirName = path.basename(path.dirname(file))
  const targets = guessTargets(dirName)

  const idMatch = content.match(/\nexport\s+const\s+id\s*=.*\n/)
  if (!idMatch) return false

  // insert import
  content = ensureImport(content)

  const idMatch2 = content.match(/\nexport\s+const\s+id\s*=.*\n/)
  if (!idMatch2) return false
  const insertIndex = content.indexOf(idMatch2[0]) + idMatch2[0].length
  const before = content.slice(0, insertIndex)
  const after = content.slice(insertIndex)
  const targetsLine = `\nexport const targets = [${targets
    .map((t) => (t === 'browser' ? 'TargetId.Browser' : t === 'node' ? 'TargetId.Node' : 'TargetId.Worker'))
    .join(', ')}]\n`
  const next = before + targetsLine + after
  fs.writeFileSync(file, next)
  return true
}

const main = () => {
  const measureDirs = fs
    .readdirSync(partsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('Measure'))
    .map((d) => path.join(partsDir, d.name))

  let changed = 0
  for (const d of measureDirs) {
    const base = path.basename(d)
    const file = path.join(d, `${base}.ts`)
    if (fs.existsSync(file)) {
      if (updateFile(file)) changed++
      continue
    }
    const tsFiles = fs.readdirSync(d).filter((f) => f.endsWith('.ts'))
    for (const f of tsFiles) {
      const full = path.join(d, f)
      if (updateFile(full)) changed++
    }
  }
  console.log(`Updated measure targets in ${changed} files.`)
}

main()
