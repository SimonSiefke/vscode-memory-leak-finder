import { rm } from 'node:fs/promises'
import * as GetUnusedFilesToRemoveLinux from '../GetUnusedFilesToRemoveLinux/GetUnusedFilesToRemoveLinux.ts'

export const removeUnusedFilesLinux = async (binaryPath: string): Promise<void> => {
  const filesToRemove = await GetUnusedFilesToRemoveLinux.getUnusedFilesToRemoveLinux(binaryPath)
  for (const absolutePath of filesToRemove) {
    try {
      await rm(absolutePath, { recursive: true, force: true })
    } catch {}
  }
}
