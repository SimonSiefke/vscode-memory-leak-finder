import { cp, rm, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

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
 * @param {FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  if (fileOperations.length === 0) {
    return
  }

  console.log(`Applying ${fileOperations.length} file operation(s) in order`)

  for (const operation of fileOperations) {
    try {
      if (operation.type === 'copy') {
        const fromPath = fileURLToPath(operation.from)
        const toPath = fileURLToPath(operation.to)
        await cp(fromPath, toPath, { recursive: true, force: true })
        console.log(`Copied: ${operation.from} -> ${operation.to}`)
      } else if (operation.type === 'remove') {
        const fromPath = fileURLToPath(operation.from)
        await rm(fromPath, { recursive: true, force: true })
        console.log(`Removed: ${operation.from}`)
      } else if (operation.type === 'mkdir') {
        const path = fileURLToPath(operation.path)
        await mkdir(path, { recursive: true })
        console.log(`Created directory: ${operation.path}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to apply file operation ${operation.type}: ${errorMessage}`)
      throw error
    }
  }
}
