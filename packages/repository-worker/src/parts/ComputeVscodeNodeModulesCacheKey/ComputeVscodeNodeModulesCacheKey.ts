import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.ts'
import { getHash } from '../GetHash/GetHash.ts'
import * as Path from '../Path/Path.ts'

/**
 * @param {string} folder
 */
export const computeVscodeNodeModulesCacheKey = async (folder: string): Promise<string> => {
  try {
    const nvmrcPath = Path.join(folder, '.nvmrc')
    const packageLockFiles = await findPackageLockFiles(folder)
    const sortedPackageLockFiles = packageLockFiles.toSorted()
    const contents = await Promise.all([
      FileSystemWorker.readFileContent(nvmrcPath),
      ...sortedPackageLockFiles.map((filePath) => FileSystemWorker.readFileContent(filePath)),
    ])
    const hash = getHash([process.platform, process.arch, ...contents])
    return hash
  } catch (error) {
    throw new VError(error, 'Failed to compute VS Code node_modules cache key')
  }
}
