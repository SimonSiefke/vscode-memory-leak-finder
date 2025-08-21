import { VError } from '@lvce-editor/verror'
import * as Path from '../Path/Path.ts'

interface CopyOperation {
  type: 'copy'
  from: string
  to: string
}

interface MkdirOperation {
  type: 'mkdir'
  path: string
}

interface RemoveOperation {
  type: 'remove'
  from: string
}

type FileOperation = CopyOperation | MkdirOperation | RemoveOperation

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
