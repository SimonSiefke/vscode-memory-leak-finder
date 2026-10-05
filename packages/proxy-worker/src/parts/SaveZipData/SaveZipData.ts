import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetProxyPaths from '../GetProxyPaths/GetProxyPaths.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

export const saveZipData = async (body: Buffer, url: string, timestamp: number): Promise<string> => {
  const zipDataDir = GetProxyPaths.getZipDataDir()
  await mkdir(zipDataDir, { recursive: true })
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.zip`
  const filepath = join(zipDataDir, filename)
  await writeFile(filepath, body)
  return filepath
}
