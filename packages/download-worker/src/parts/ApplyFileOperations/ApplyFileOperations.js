import { cpSync, rmSync } from 'node:fs'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @param {FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  if (fileOperations.length === 0) {
    return
  }

  console.log(`Applying ${fileOperations.length} file operation(s) in parallel`)

  const operations = fileOperations.map(async (operation) => {
    try {
      if (operation.type === 'copy') {
        cpSync(operation.from, operation.to, { recursive: true, force: true })
        console.log(`Copied: ${operation.from} -> ${operation.to}`)
      } else if (operation.type === 'remove') {
        rmSync(operation.from, { recursive: true, force: true })
        console.log(`Removed: ${operation.from}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to apply file operation ${operation.type}: ${errorMessage}`)
      throw error
    }
  })

  await Promise.all(operations)
}
