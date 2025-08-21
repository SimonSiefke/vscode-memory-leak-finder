import { FileOperation } from '../FileOperation/FileOperation.ts'
import * as Path from '../Path/Path.ts'

export const getRestoreNodeModulesFileOperations = (from: string, to: string, pathsToRestore: string[]): readonly FileOperation[] => {
  return pathsToRestore.map((relativePath) => {
    const sourceNodeModulesPath = Path.join(from, relativePath)
    const targetPath = Path.join(to, relativePath)
    return {
      type: 'copy',
      from: sourceNodeModulesPath,
      to: targetPath,
    }
  })
}
