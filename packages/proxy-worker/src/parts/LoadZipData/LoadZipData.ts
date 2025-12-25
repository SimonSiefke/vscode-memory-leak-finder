import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

export const loadZipData = async (fileReference: string): Promise<Buffer | null> => {
  if (!fileReference.startsWith('file-reference:')) {
    return null
  }
  const filepath = fileReference.slice('file-reference:'.length)
  if (!existsSync(filepath)) {
    return null
  }
  return await readFile(filepath)
}
