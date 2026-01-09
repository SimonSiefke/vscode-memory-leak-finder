import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

const ZIP_DATA_DIR = join(Root.root, '.vscode-zip-data')

export const saveSseData = async (body: Buffer, url: string, timestamp: number, testName?: string): Promise<string> => {
  const testSpecificDir = testName ? join(ZIP_DATA_DIR, SanitizeFilename.sanitizeFilename(testName)) : ZIP_DATA_DIR
  await mkdir(testSpecificDir, { recursive: true })
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.txt`
  const filepath = join(testSpecificDir, filename)
  await writeFile(filepath, body)
  return filepath
}
