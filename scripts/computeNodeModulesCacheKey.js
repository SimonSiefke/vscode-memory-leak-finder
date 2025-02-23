import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const locations = [
  '.nvmrc',
  'lerna.json',
  'package-lock.json',
  'packages/charts/package-lock.json',
  'packages/cli/package-lock.json',
  'packages/cursor-e2e/package-lock.json',
  'packages/devtools-protocol/package-lock.json',
  'packages/download-worker/package-lock.json',
  'packages/download-worker/package.json',
  'packages/e2e/package-lock.json',
  'packages/file-watcher-worker/package-lock.json',
  'packages/heap-snapshot-worker/package-lock.json',
  'packages/injected-code/package-lock.json',
  'packages/memory-leak-finder/package-lock.json',
  'packages/memory-leak-worker/package-lock.json',
  'packages/page-object/package-lock.json',
  'packages/postinstall-tools/package-lock.json',
  'packages/source-map-worker/package-lock.json',
  'packages/storage-worker/package-lock.json',
  'packages/test-coordinator/package-lock.json',
  'packages/test-coordinator/src/parts/VsCodeVersion/VsCodeVersion.js',
  'packages/test-worker-commands/package-lock.json',
  'packages/test-worker/package-lock.json',
  'packages/video-recording-worker/package-lock.json',
  '.github/workflows/ci.yml',
  '.github/workflows/pr.yml',
  '.github/workflows/release.yml',
  'scripts/computeNodeModulesCacheKey.js',
]

const getAbsolutePath = (relativePath) => {
  return join(root, relativePath)
}

const getContent = (absolutePath) => {
  return readFile(absolutePath, 'utf8')
}

export const computeHash = (contents) => {
  const hash = createHash('sha1')
  if (Array.isArray(contents)) {
    for (const content of contents) {
      hash.update(content)
    }
  } else if (typeof contents === 'string') {
    hash.update(contents)
  }
  return hash.digest('hex')
}

const computeCacheKey = async (locations) => {
  const absolutePaths = locations.map(getAbsolutePath)
  const contents = await Promise.all(absolutePaths.map(getContent))
  const hash = computeHash(contents)
  return hash
}

const main = async () => {
  const hash = await computeCacheKey(locations)
  process.stdout.write(hash)
}

main()
