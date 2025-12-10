import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export const loadZipData = async (fileReference: string): Promise<Buffer | null> => {
  if (!fileReference.startsWith('file-reference:')) {
    return null
  }
  const filepath = fileReference.substring('file-reference:'.length)
  if (!existsSync(filepath)) {
    return null
  }
  return await readFile(filepath)
}

