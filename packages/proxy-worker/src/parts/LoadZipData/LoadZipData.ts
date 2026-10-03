import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import * as PathPlaceholders from '../PathPlaceholders/PathPlaceholders.ts'

export const loadZipData = async (fileReference: string): Promise<Buffer | null> => {
  if (!fileReference.startsWith('file-reference:')) {
    return null
  }
  const filepath = PathPlaceholders.restoreAbsolutePathsFromPlaceholdersInText(fileReference.slice('file-reference:'.length))
  if (!existsSync(filepath)) {
    return null
  }
  return await readFile(filepath)
}
