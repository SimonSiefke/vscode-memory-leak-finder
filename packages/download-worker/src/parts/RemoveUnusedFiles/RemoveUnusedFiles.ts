import * as RemoveUnusedFilesLinux from '../RemoveUnusedFilesLinux/RemoveUnusedFilesLinux.ts'

export const removeUnusedFiles = async (binaryPath: string): Promise<void> => {
  if (process.platform !== 'linux') {
    return
  }
  await RemoveUnusedFilesLinux.removeunusedfileslinux(binaryPath)
}
