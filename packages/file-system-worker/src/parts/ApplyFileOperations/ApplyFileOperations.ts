import { applyFileOperation, FileOperation } from '../ApplyFileOperation/ApplyFileOperation.js'

export const applyFileOperations = async (fileOperations: FileOperation[]): Promise<void> => {
  for (const operation of fileOperations) {
    await applyFileOperation(operation)
  }
}
