import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { VError } from '@lvce-editor/verror'
import JSZip from 'jszip'

const validateRelativePath = (normalizedName: string, archiveLabel: string): void => {
  const segments = normalizedName.split('/').filter(Boolean)
  if (segments.some((segment) => segment === '..')) {
    throw new Error(`Invalid ${archiveLabel} archive entry path: ${normalizedName}`)
  }
}

const extractZipToDirectory = async ({
  archiveLabel,
  normalizeEntryName,
  targetDir,
  zipContent,
}: {
  archiveLabel: string
  normalizeEntryName: (name: string) => string
  targetDir: string
  zipContent: Buffer
}): Promise<void> => {
  const zip = await JSZip.loadAsync(zipContent)
  await rm(targetDir, { force: true, recursive: true })
  await mkdir(targetDir, { recursive: true })
  for (const file of Object.values(zip.files)) {
    const normalizedName = normalizeEntryName(file.name)
    if (!normalizedName) {
      continue
    }
    validateRelativePath(normalizedName, archiveLabel)
    const destinationPath = join(targetDir, normalizedName)
    if (file.dir) {
      await mkdir(destinationPath, { recursive: true })
      continue
    }
    const content = await file.async('nodebuffer')
    await mkdir(dirname(destinationPath), { recursive: true })
    await writeFile(destinationPath, content)
  }
}

const redactUrl = (value: string): string => {
  const queryIndex = value.indexOf('?')
  if (queryIndex === -1) {
    return value
  }
  return `${value.slice(0, queryIndex)}?[redacted]`
}

export const stripTopLevelDirectoryFromZipEntryName = (name: string): string => {
  const segments = name.split('/').filter(Boolean)
  if (segments.length <= 1) {
    return ''
  }
  return segments.slice(1).join('/')
}

export const restoreZipArchive = async ({
  archiveLabel,
  downloadToken,
  downloadUrl,
  normalizeEntryName = stripTopLevelDirectoryFromZipEntryName,
  targetDir,
}: {
  archiveLabel: string
  downloadToken: string
  downloadUrl: string
  normalizeEntryName?: (name: string) => string
  targetDir: string
}): Promise<void> => {
  try {
    const redactedUrl = redactUrl(downloadUrl)
    console.log(`[repository] restoring ${archiveLabel} from url ${redactedUrl} with token [redacted].`)
    const requestInit: RequestInit = {
      signal: AbortSignal.timeout(30_000),
    }
    if (downloadToken) {
      requestInit.headers = {
        authorization: `Bearer ${downloadToken}`,
      }
    }
    const response = await fetch(downloadUrl, requestInit)
    if (!response.ok) {
      throw new Error(`Failed to download ${archiveLabel} zip file: ${response.status} ${response.statusText}`)
    }
    console.log(`[repository] downloaded ${archiveLabel} archive, extracting...`)
    const zipContent = Buffer.from(await response.arrayBuffer())
    await extractZipToDirectory({
      archiveLabel,
      normalizeEntryName,
      targetDir,
      zipContent,
    })
    console.log(`[repository] restored ${archiveLabel} successfully.`)
  } catch (error) {
    const redactedUrl = redactUrl(downloadUrl)
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new VError(error, `Failed to restore ${archiveLabel} from ${redactedUrl}: request timed out after 30s`)
    }
    throw new VError(error, `Failed to restore ${archiveLabel} from ${redactedUrl}`)
  }
}
