import { cp, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as RestoreZipArchive from '../RestoreZipArchive/RestoreZipArchive.ts'
import * as Root from '../Root/Root.ts'

const allMockDataDirectories = [
  '.vscode-user-data-dir',
  '.vscode-mock-requests',
  '.vscode-proxy-certs',
  '.vscode-sse-data',
  '.vscode-requests',
]

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const normalizeAllMockDataEntryName = (name: string): string => {
  const segments = name.split('/').filter(Boolean)
  if (segments.length === 0) {
    return ''
  }
  if (segments[0]?.startsWith('.vscode-')) {
    return segments.join('/')
  }
  if (segments.length > 1 && segments[1]?.startsWith('.vscode-')) {
    return segments.slice(1).join('/')
  }
  return segments.join('/')
}

export const restoreAllMockDataArchive = async ({
  downloadToken,
  downloadUrl,
  rootDir = Root.root,
}: {
  downloadToken: string
  downloadUrl: string
  rootDir?: string
}): Promise<void> => {
  const temporaryDir = await mkdtemp(join(tmpdir(), 'all-mock-data-'))
  try {
    await RestoreZipArchive.restoreZipArchive({
      archiveLabel: 'all mock data',
      downloadToken,
      downloadUrl,
      normalizeEntryName: normalizeAllMockDataEntryName,
      targetDir: temporaryDir,
    })
    for (const directoryName of allMockDataDirectories) {
      const sourcePath = join(temporaryDir, directoryName)
      const targetPath = join(rootDir, directoryName)
      if (!(await pathExists(sourcePath))) {
        continue
      }
      await rm(targetPath, { force: true, recursive: true })
      await cp(sourcePath, targetPath, { recursive: true })
    }
  } finally {
    await rm(temporaryDir, { force: true, recursive: true })
  }
}
