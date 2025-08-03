import { readFile } from 'node:fs/promises'
import { getHash } from '../GetHash/GetHash.js'
import { VError } from '@lvce-editor/verror'

export const getFilesHash = async (absolutePaths) => {
  try {
    const contents = await Promise.all(absolutePaths.map((file) => readFile(file, 'utf8')))
    const hash = getHash(contents)
    return hash
  } catch (error) {
    throw new VError(error, `Failed to get files hash`)
  }
}
