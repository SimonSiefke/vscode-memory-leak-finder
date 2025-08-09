import { applyFileOperation } from '../ApplyFileOperation/ApplyFileOperation.ts'

/**
 * @param {import('../ApplyFileOperation/ApplyFileOperation.ts').FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
