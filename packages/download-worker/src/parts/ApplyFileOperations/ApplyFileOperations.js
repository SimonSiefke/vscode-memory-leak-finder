import { cp, rm, mkdir } from 'node:fs/promises'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove' | 'mkdir'} type
 * @property {string} from
 * @property {string} to
 * @property {string} path
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
        await cp(operation.from, operation.to, { recursive: true, force: true })
        console.log(`Copied: ${operation.from} -> ${operation.to}`)
      } else if (operation.type === 'remove') {
        await rm(operation.from, { recursive: true, force: true })
        console.log(`Removed: ${operation.from}`)
      } else if (operation.type === 'mkdir') {
        await mkdir(operation.path, { recursive: true })
        console.log(`Created directory: ${operation.path}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to apply file operation ${operation.type}: ${errorMessage}`)
      throw error
    }
  }
}
