import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(import.meta.dirname, '../../..')

const computeSourceMapsCacheKey = async (): Promise<string> => {
  const vscodeVersionPath = join(root, 'packages/initialization-worker/src/parts/VsCodeVersion/VsCodeVersion.ts')
  const content = await readFile(vscodeVersionPath, 'utf8')
  const hash = createHash('sha1')
  hash.update(content)
  return hash.digest('hex')
}

const main = async (): Promise<void> => {
  try {
    const hash = await computeSourceMapsCacheKey()
    process.stdout.write(hash)
  } catch (error) {
    console.error('Error computing source maps cache key:', (error as Error).message)
    process.exit(1)
  }
}

main()
