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
export const applyFileOperation = async (operation) => {
  try {
    switch (operation.type) {
      case 'copy': {
        const fromPath = operation.from
        const toPath = operation.to
        await copy(fromPath, toPath)
        console.log(`Copied: ${operation.from} -> ${operation.to}`)

        break
      }

      case 'remove': {
        const fromPath = operation.from
        await remove(fromPath)
        console.log(`Removed: ${operation.from}`)

        break
      }

      case 'mkdir': {
        const { path } = operation
        await makeDirectory(path)
        console.log(`Created directory: ${operation.path}`)

        break
      }
      // No default
    }
  } catch (error) {
    throw new VError(error, `Failed to apply file operation ${operation.type}`)
  }
}
