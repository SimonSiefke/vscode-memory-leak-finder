import { applyFileOperation } from '../ApplyFileOperation/ApplyFileOperation.js'
import type { FileOperation } from '../ApplyFileOperation/ApplyFileOperation.js'

export const applyFileOperations = async (fileOperations: readonly FileOperation[]): Promise<void> => {
  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
