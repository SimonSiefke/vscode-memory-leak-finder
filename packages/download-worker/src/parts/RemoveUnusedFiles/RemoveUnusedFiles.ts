import * as RemoveUnusedFilesLinux from '../RemoveUnusedFilesLinux/RemoveUnusedFilesLinux.ts'

export const removeUnusedFiles = async (platform: string, binaryPath: string): Promise<void> => {
  if (platform !== 'linux') {
    return
  }
  await RemoveUnusedFilesLinux.removeUnusedFilesLinux(binaryPath)
}
