import * as RestoreZipArchive from '../RestoreZipArchive/RestoreZipArchive.ts'

const preservedRootDirectories = new Set([
  'Backups',
  'Cache',
  'CachedData',
  'Code Cache',
  'GPUCache',
  'History',
  'Local Storage',
  'Machine',
  'Session Storage',
  'User',
  'globalStorage',
  'logs',
  'workspaceStorage',
])

const normalizeUserDataZipEntryName = (name: string): string => {
  const segments = name.split('/').filter(Boolean)
  if (segments.length === 0) {
    return ''
  }
  if (!preservedRootDirectories.has(segments[0]) && segments.length > 1) {
    return segments.slice(1).join('/')
  }
  return segments.join('/')
}

export const restoreUserDataDir = async ({
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  userDataDir,
}: {
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  userDataDir: string
}): Promise<void> => {
  return RestoreZipArchive.restoreZipArchive({
    archiveLabel: 'user data dir',
    downloadToken: downloadUserDataZipFileToken,
    downloadUrl: downloadUserDataZipFileUrl,
    normalizeEntryName: normalizeUserDataZipEntryName,
    targetDir: userDataDir,
  })
}
