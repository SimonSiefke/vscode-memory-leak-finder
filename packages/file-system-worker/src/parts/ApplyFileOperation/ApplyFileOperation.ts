import { VError } from '@lvce-editor/verror'
import { copy, makeDirectory, remove, writeFileContent } from '../Filesystem/Filesystem.ts'

export interface CopyOperation {
  readonly type: 'copy'
  readonly from: string
  readonly to: string
}

export interface MkdirOperation {
  readonly type: 'mkdir'
  readonly path: string
}

export interface RemoveOperation {
  readonly type: 'remove'
  readonly from: string
}

export interface WriteOperation {
  readonly type: 'write'
  readonly path: string
  readonly content: string
}

export type FileOperation = CopyOperation | MkdirOperation | RemoveOperation | WriteOperation

export const applyFileOperation = async (operation: FileOperation): Promise<void> => {
  try {
    switch (operation.type) {
      case 'copy': {
        const fromPath: string = operation.from
        const toPath: string = operation.to
        await copy(fromPath, toPath, {
          recursive: true,
        })
        break
      }

      case 'remove': {
        const fromPath: string = operation.from
        await remove(fromPath, { recursive: true })
        break
      }

      case 'mkdir': {
        const { path } = operation
        await makeDirectory(path, { recursive: true })
        break
      }

      case 'write': {
        const { path, content } = operation
        await writeFileContent(path, content, 'utf8')
        break
      }
    }
  } catch (error) {
    throw new VError(error, `Failed to apply file operation ${operation.type}`)
  }
}
