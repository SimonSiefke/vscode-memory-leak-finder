import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

const IMAGE_DATA_DIR = join(Root.root, '.vscode-image-data')

const getImageExtension = (contentType: string): string => {
  const contentTypeLower = contentType.toLowerCase()
  if (contentTypeLower.includes('png')) {
    return 'png'
  }
  if (contentTypeLower.includes('jpeg') || contentTypeLower.includes('jpg')) {
    return 'jpg'
  }
  if (contentTypeLower.includes('gif')) {
    return 'gif'
  }
  if (contentTypeLower.includes('webp')) {
    return 'webp'
  }
  if (contentTypeLower.includes('svg')) {
    return 'svg'
  }
  if (contentTypeLower.includes('bmp')) {
    return 'bmp'
  }
  if (contentTypeLower.includes('ico')) {
    return 'ico'
  }
  // Default to png if unknown
  return 'png'
}

export const saveImageData = async (body: Buffer, url: string, timestamp: number, contentType: string): Promise<string> => {
  await mkdir(IMAGE_DATA_DIR, { recursive: true })
  const extension = getImageExtension(contentType)
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.${extension}`
  const filepath = join(IMAGE_DATA_DIR, filename)
  await writeFile(filepath, body)
  return filepath
}
