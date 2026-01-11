import { VError } from '@lvce-editor/verror'
import { copy, makeDirectory, remove, writeFileContent } from '../Filesystem/Filesystem.ts'

export interface CopyOperation {
  readonly from: string
  readonly to: string
  readonly type: 'copy'
}

export interface MkdirOperation {
  readonly path: string
  readonly type: 'mkdir'
}

export interface RemoveOperation {
  readonly from: string
  readonly type: 'remove'
}

export interface WriteOperation {
  readonly content: string
  readonly path: string
  readonly type: 'write'
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

      case 'mkdir': {
        const { path } = operation
        await makeDirectory(path, { recursive: true })
        break
      }

      case 'remove': {
        const fromPath: string = operation.from
        await remove(fromPath, { recursive: true })
        break
      }

      case 'write': {
        const { content, path } = operation
        await writeFileContent(path, content, 'utf8')
        break
      }
    }
  } catch (error) {
    throw new VError(error, `Failed to apply file operation ${operation.type}`)
  }
}
