import { VError } from '@lvce-editor/verror'
import { readFileContent } from '../Filesystem/Filesystem.js'
import { getHash } from '../GetHash/GetHash.js'

export const getFilesHash = async (absolutePaths) => {
  try {
    const contents = await Promise.all(absolutePaths.map((file) => readFileContent(file)))
    const hash = getHash(contents)
    return hash
  } catch (error) {
    throw new VError(error, 'Failed to get files hash')
  }
}
