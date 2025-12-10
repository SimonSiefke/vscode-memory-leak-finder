import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'

const ZIP_DATA_DIR = join(Root.root, '.vscode-zip-data')

const sanitizeFilename = (url: string): string => {
  return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200)
}

export const saveZipData = async (body: Buffer, url: string, timestamp: number): Promise<string> => {
  await mkdir(ZIP_DATA_DIR, { recursive: true })
  const filename = `${timestamp}_${sanitizeFilename(url)}.zip`
  const filepath = join(ZIP_DATA_DIR, filename)
  await writeFile(filepath, body)
  return filepath
}
