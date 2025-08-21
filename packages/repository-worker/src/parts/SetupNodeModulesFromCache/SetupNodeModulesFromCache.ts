import { VError } from '@lvce-editor/verror'
import * as Filesystem from '../Filesystem/Filesystem.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.ts'

export const copyNodeModulesFromCacheToFolder = async (from: string, to: string) => {
  try {
    const allCachedNodeModulesPaths = await Filesystem.findFiles('**/node_modules', { cwd: from })
    const cachedNodeModulesPaths = allCachedNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules'))
    const fileOperations = GetRestoreFileOperations.getRestoreNodeModulesFileOperations(from, to, cachedNodeModulesPaths)
    await FileSystemWorker.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, 'Failed to setup node_modules from cache')
  }
}
