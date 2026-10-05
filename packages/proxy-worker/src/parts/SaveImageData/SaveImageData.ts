import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetProxyPaths from '../GetProxyPaths/GetProxyPaths.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

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
  const imageDataDir = GetProxyPaths.getImageDataDir()
  await mkdir(imageDataDir, { recursive: true })
  const extension = getImageExtension(contentType)
  const filename = `${timestamp}_${SanitizeFilename.sanitizeFilename(url)}.${extension}`
  const filepath = join(imageDataDir, filename)
  await writeFile(filepath, body)
  return filepath
}
