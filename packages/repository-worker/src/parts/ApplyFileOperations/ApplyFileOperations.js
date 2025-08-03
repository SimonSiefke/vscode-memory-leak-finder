import { VError } from '@lvce-editor/verror'
import { copy, makeDirectory, remove } from '../Filesystem/Filesystem.js'

/**
 * @typedef {Object} CopyOperation
 * @property {'copy'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {Object} MkdirOperation
 * @property {'mkdir'} type
 * @property {string} path
 */

/**
 * @typedef {Object} RemoveOperation
 * @property {'remove'} type
 * @property {string} from
 */

/**
 * @typedef {CopyOperation | MkdirOperation | RemoveOperation} FileOperation
 */

/**
 * @param {FileOperation} operation
 */
const applyFileOperation = async (operation) => {
  try {
    if (operation.type === 'copy') {
      const fromPath = operation.from
      const toPath = operation.to
      await copy(fromPath, toPath)
      console.log(`Copied: ${operation.from} -> ${operation.to}`)
    } else if (operation.type === 'remove') {
      const fromPath = operation.from
      await remove(fromPath)
      console.log(`Removed: ${operation.from}`)
    } else if (operation.type === 'mkdir') {
      const path = operation.path
      await makeDirectory(path)
      console.log(`Created directory: ${operation.path}`)
    }
  } catch (error) {
    throw new VError(error, `Failed to apply file operation ${operation.type}`)
  }
}

/**
 * @param {FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  if (fileOperations.length === 0) {
    return
  }
  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
