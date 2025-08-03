import { applyFileOperation } from '../ApplyFileOperation/ApplyFileOperation.js'

/**
 * @param {import('../ApplyFileOperation/ApplyFileOperation.js').FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  if (fileOperations.length === 0) {
    return
  }

  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
