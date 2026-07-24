import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const hashDirectory = async (hash: ReturnType<typeof createHash>, root: string, current: string): Promise<void> => {
  const entries = (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.vscode-memory-leak-finder-results')) {
      continue
    }
    const path = join(current, entry.name)
    if (entry.isDirectory()) {
      await hashDirectory(hash, root, path)
    } else if (entry.isFile()) {
      hash.update(relative(root, path))
      hash.update(await readFile(path))
    }
  }
}

export const hashPaths = async (paths: readonly string[]): Promise<string> => {
  const hash = createHash('sha256')
  for (const path of [...paths].sort()) {
    await hashDirectory(hash, path, path)
  }
  return hash.digest('hex')
}
