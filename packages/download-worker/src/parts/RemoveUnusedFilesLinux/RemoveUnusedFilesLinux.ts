import { join, resolve } from 'node:path'
import { readdir, rm } from 'node:fs/promises'
import * as GetUnusedFilesToRemoveLinux from '../GetUnusedFilesToRemoveLinux/GetUnusedFilesToRemoveLinux.ts'

export const removeunusedfileslinux = async (binaryPath: string): Promise<void> => {
  const filesToRemove = await GetUnusedFilesToRemoveLinux.getunusedfilestoremovelinux(binaryPath)
  for (const absolutePath of filesToRemove) {
    try {
      await rm(absolutePath, { recursive: true, force: true })
    } catch {}
  }
}


