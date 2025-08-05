import { applyFileOperation } from '../ApplyFileOperation/ApplyFileOperation.js'

/**
 * @param {import('../ApplyFileOperation/ApplyFileOperation.js').FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
