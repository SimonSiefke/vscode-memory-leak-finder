import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

const ZIP_DATA_DIR = join(Root.root, '.vscode-zip-data')

export const saveZipData = async (body: Buffer, url: string, timestamp: number): Promise<string> => {
  await mkdir(ZIP_DATA_DIR, { recursive: true })
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.zip`
  const filepath = join(ZIP_DATA_DIR, filename)
  await writeFile(filepath, body)
  return filepath
}
