import JSZip from 'jszip'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { BotEnv } from '../Env/Env.ts'

export interface UserDataSnapshotMetadata {
  readonly downloadToken: string
  readonly uploadedAt: number
  readonly uploadedBy: string
}

export const userDataSnapshotUnavailableMessage = 'No uploaded vscode-user-data-dir snapshot is available'
export const allMockDataSnapshotUnavailableMessage = 'No uploaded all-mock-data snapshot is available'

export const userDataDownloadPath = '/api/user-data/download'
export const allMockDataDownloadPath = '/api/all-mock-data/download'

const metadataFileName = 'active-user-data-snapshot.json'
const zipFileName = 'active-user-data-snapshot.zip'

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

const getMetadataPath = (storagePath: string): string => {
  return join(storagePath, metadataFileName)
}

const getZipPath = (storagePath: string): string => {
  return join(storagePath, zipFileName)
}

export const normalizeUserDataZipEntryName = (name: string): string => {
  const segments = name.split('/').filter(Boolean)
  if (segments.length === 0) {
    return ''
  }
  if (!preservedRootDirectories.has(segments[0]) && segments.length > 1) {
    return segments.slice(1).join('/')
  }
  return segments.join('/')
}

export const validateUserDataSnapshot = async (zipContent: Buffer): Promise<void> => {
  const zip = await JSZip.loadAsync(zipContent)
  const hasUserDirectory = Object.values(zip.files).some((file) => {
    if (file.dir) {
      return false
    }
    const normalizedName = normalizeUserDataZipEntryName(file.name)
    return normalizedName.startsWith('User/')
  })
  if (!hasUserDirectory) {
    throw new Error('The uploaded zip file must contain a vscode-user-data-dir User directory')
  }
}

export const saveUserDataSnapshot = async (
  storagePath: string,
  zipContent: Buffer,
  uploadedBy: string,
): Promise<{ readonly downloadToken: string }> => {
  await validateUserDataSnapshot(zipContent)
  await mkdir(storagePath, { recursive: true })
  const downloadToken = randomBytes(24).toString('hex')
  const metadata: UserDataSnapshotMetadata = {
    downloadToken,
    uploadedAt: Date.now(),
    uploadedBy,
  }
  await Promise.all([
    writeFile(getZipPath(storagePath), zipContent),
    writeFile(getMetadataPath(storagePath), JSON.stringify(metadata, null, 2)),
  ])
  return {
    downloadToken,
  }
}

export const readUserDataSnapshotMetadata = async (storagePath: string): Promise<UserDataSnapshotMetadata | undefined> => {
  try {
    const content = await readFile(getMetadataPath(storagePath), 'utf8')
    return JSON.parse(content) as UserDataSnapshotMetadata
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

export const readUserDataSnapshotZip = async (storagePath: string): Promise<Buffer | undefined> => {
  try {
    return await readFile(getZipPath(storagePath))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

const getDownloadUrl = (baseUrl: string, path: string): string => {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

export const getUserDataDownloadUrl = (baseUrl: string): string => {
  return getDownloadUrl(baseUrl, userDataDownloadPath)
}

export const getAllMockDataDownloadUrl = (baseUrl: string): string => {
  return getDownloadUrl(baseUrl, allMockDataDownloadPath)
}

export const hasAnyR2Config = (env: BotEnv): boolean => {
  return !!env.userDataR2AccessKeyId || !!env.userDataR2AccountId || !!env.userDataR2Bucket || !!env.userDataR2SecretAccessKey
}

export const getMissingR2Config = (env: BotEnv): readonly string[] => {
  return [
    ['BOT_USER_DATA_R2_ACCESS_KEY_ID', env.userDataR2AccessKeyId],
    ['BOT_USER_DATA_R2_ACCOUNT_ID', env.userDataR2AccountId],
    ['BOT_USER_DATA_R2_BUCKET', env.userDataR2Bucket],
    ['BOT_USER_DATA_R2_SECRET_ACCESS_KEY', env.userDataR2SecretAccessKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)
}

export const getUserDataDownloadInfo = async (
  env: BotEnv,
): Promise<{
  readonly downloadUserDataZipFileToken: string
  readonly downloadUserDataZipFileUrl: string
  readonly downloadAllMockDataZipFileUrl: string
}> => {
  if (hasAnyR2Config(env)) {
    const missing = getMissingR2Config(env)
    if (missing.length > 0) {
      throw new Error(`Incomplete R2 snapshot configuration. Missing: ${missing.join(', ')}`)
    }
    if (!env.publicBaseUrl) {
      throw new Error('BOT_PUBLIC_BASE_URL must be configured before starting measure workflows with private R2 snapshots')
    }
    if (!env.userDataUploadToken) {
      throw new Error('BOT_USER_DATA_UPLOAD_TOKEN must be configured before starting measure workflows with private R2 snapshots')
    }
    return {
      downloadAllMockDataZipFileUrl: getAllMockDataDownloadUrl(env.publicBaseUrl),
      downloadUserDataZipFileToken: env.userDataUploadToken,
      downloadUserDataZipFileUrl: '',
    }
  }
  if (env.userDataSnapshotUrl) {
    return {
      downloadAllMockDataZipFileUrl: '',
      downloadUserDataZipFileToken: env.userDataSnapshotToken,
      downloadUserDataZipFileUrl: env.userDataSnapshotUrl,
    }
  }
  if (!env.publicBaseUrl) {
    throw new Error('BOT_PUBLIC_BASE_URL must be configured before starting measure workflows')
  }
  const metadata = await readUserDataSnapshotMetadata(env.userDataStoragePath)
  const zipContent = await readUserDataSnapshotZip(env.userDataStoragePath)
  if (!metadata || !zipContent) {
    throw new Error(userDataSnapshotUnavailableMessage)
  }
  return {
    downloadAllMockDataZipFileUrl: '',
    downloadUserDataZipFileToken: metadata.downloadToken,
    downloadUserDataZipFileUrl: getUserDataDownloadUrl(env.publicBaseUrl),
  }
}
