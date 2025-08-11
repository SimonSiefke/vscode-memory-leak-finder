import { join, resolve } from 'node:path'
import { readdir, rm } from 'node:fs/promises'

export const getUnusedFilesToRemoveLinux = async (binaryPath: string): Promise<string[]> => {
  const filesToRemove: string[] = []
  const installDir: string = resolve(binaryPath, '..')
  const appRoot: string = join(installDir, 'resources', 'app')
  const localesDir: string = join(installDir, 'locales')

  // Remove locales except en-US
  try {
    const entries = await readdir(localesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.pak') && entry.name !== 'en-US.pak') {
        filesToRemove.push(join(localesDir, entry.name))
      }
    }
  } catch {}

  // Remove bin folder
  filesToRemove.push(join(installDir, 'bin'))

  // Remove Chromium licenses file
  filesToRemove.push(join(installDir, 'LICENSES.chromium.html'))

  // Remove vsce-sign artifacts if present
  const possibleVsceBases: readonly string[] = [
    join(appRoot, 'node_modules', '@vscode'),
    join(appRoot, 'node_modules.asar.unpacked', '@vscode'),
  ]
  for (const base of possibleVsceBases) {
    try {
      const entries = await readdir(base, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('vsce-sign')) {
          filesToRemove.push(join(base, entry.name))
        }
      }
    } catch {}
  }

  return filesToRemove
}

export const removeUnusedFilesLinux = async (binaryPath: string): Promise<void> => {
  const filesToRemove = await getUnusedFilesToRemoveLinux(binaryPath)
  for (const targetPath of filesToRemove) {
    try {
      await rm(targetPath, { recursive: true, force: true })
    } catch {}
  }
}

export const removeUnusedFiles = async (binaryPath: string): Promise<void> => {
  if (process.platform !== 'linux') {
    return
  }
  await removeUnusedFilesLinux(binaryPath)
}

import * as RemoveUnusedFilesLinux from '../RemoveUnusedFilesLinux/RemoveUnusedFilesLinux.ts'

export const removeunusedfiles = async (binaryPath: string): Promise<void> => {
  if (process.platform !== 'linux') {
    return
  }
  await RemoveUnusedFilesLinux.removeunusedfileslinux(binaryPath)
}


