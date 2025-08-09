import { VError } from '@lvce-editor/verror'
import { copy, makeDirectory, remove } from '../Filesystem/Filesystem.js'

export interface CopyOperation {
  type: 'copy'
  from: string
  to: string
}

export interface MkdirOperation {
  type: 'mkdir'
  path: string
}

export interface RemoveOperation {
  type: 'remove'
  from: string
}

export type FileOperation = CopyOperation | MkdirOperation | RemoveOperation

export const applyFileOperation = async (operation: FileOperation): Promise<void> => {
  try {
    switch (operation.type) {
      case 'copy': {
        const fromPath: string = operation.from
        const toPath: string = operation.to
        await copy(fromPath, toPath)
        break
      }

      case 'remove': {
        const fromPath: string = operation.from
        await remove(fromPath)
        break
      }

      case 'mkdir': {
        const { path } = operation
        await makeDirectory(path)
        break
      }
    }
  } catch (error) {
    throw new VError(error, `Failed to apply file operation ${operation.type}`)
  }
}
