import type { FileOperation } from '../ApplyFileOperation/ApplyFileOperation.ts'
import { applyFileOperation } from '../ApplyFileOperation/ApplyFileOperation.ts'

export const applyFileOperations = async (fileOperations: readonly FileOperation[]): Promise<void> => {
  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
