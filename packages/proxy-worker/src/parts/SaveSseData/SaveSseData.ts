import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

const ZIP_DATA_DIR = join(Root.root, '.vscode-zip-data')

export const saveSseData = async (body: Buffer, url: string, timestamp: number): Promise<string> => {
  await mkdir(ZIP_DATA_DIR, { recursive: true })
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.txt`
  const filepath = join(ZIP_DATA_DIR, filename)
  await writeFile(filepath, body)
  return filepath
}

