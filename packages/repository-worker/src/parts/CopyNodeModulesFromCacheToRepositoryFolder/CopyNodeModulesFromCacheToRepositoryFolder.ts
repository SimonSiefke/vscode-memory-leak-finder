import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.ts'

export const copyNodeModulesFromCacheToRepositoryFolder = async (from: string, to: string) => {
  try {
    const allCachedNodeModulesPaths = await FileSystemWorker.findFiles('**/node_modules', { cwd: from })
    const cachedNodeModulesPaths = allCachedNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules'))
    const fileOperations = GetRestoreFileOperations.getRestoreNodeModulesFileOperations(from, to, cachedNodeModulesPaths)
    await FileSystemWorker.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, 'Failed to setup node_modules from cache')
  }
}
