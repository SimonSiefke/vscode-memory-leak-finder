import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetProxyPaths from '../GetProxyPaths/GetProxyPaths.ts'
import * as PathPlaceholders from '../PathPlaceholders/PathPlaceholders.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

export const saveSseData = async (body: Buffer, url: string, timestamp: number): Promise<string> => {
  const sseDataDir = GetProxyPaths.getSseDataDir()
  await mkdir(sseDataDir, { recursive: true })
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.txt`
  const filepath = join(sseDataDir, filename)
  const sanitizedBody = Buffer.from(PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInText(body.toString('utf8')), 'utf8')
  await writeFile(filepath, sanitizedBody)
  return filepath
}
