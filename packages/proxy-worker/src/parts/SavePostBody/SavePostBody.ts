import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

export const savePostBody = async (method: string, url: string, headers: Record<string, string>, body: Buffer): Promise<void> => {
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return
  }

  try {
    await mkdir(REQUESTS_DIR, { recursive: true })
    const timestamp = Date.now()
    const filename = `${timestamp}_POST_${SanitizeFilename.sanitizeFilename(url)}.json`
    const filepath = join(REQUESTS_DIR, filename)

    const contentType = headers['content-type'] || headers['Content-Type'] || ''
    const contentTypeLower = contentType.toLowerCase()

    let parsedBody: any = body.toString('utf8')
    let bodyFormat = 'text'

    // Handle zip files separately
    if (contentTypeLower.includes('application/zip')) {
      const zipFilePath = await SaveZipData.saveZipData(body, url, timestamp)
      parsedBody = `file-reference:${zipFilePath}`
      bodyFormat = 'zip'
    }
    // Try to parse JSON
    else if (contentTypeLower.includes('application/json')) {
      try {
        parsedBody = JSON.parse(parsedBody)
        bodyFormat = 'json'
      } catch {
        // Keep as string if parsing fails
      }
    }
    // Try to parse form data
    else if (contentTypeLower.includes('application/x-www-form-urlencoded')) {
      try {
        const formData: Record<string, string> = {}
        const params = new URLSearchParams(parsedBody)
        params.forEach((value, key) => {
          formData[key] = value
        })
        parsedBody = formData
        bodyFormat = 'form-urlencoded'
      } catch {
        // Keep as string if parsing fails
      }
    }
    // Try to parse multipart form data (basic parsing)
    else if (contentTypeLower.includes('multipart/form-data')) {
      bodyFormat = 'multipart-form-data'
      // For multipart, we'll save the raw body as it's complex to parse
    }

    const postData = {
      timestamp,
      method,
      url,
      contentType,
      bodyFormat,
      headers,
      body: parsedBody,
      rawBody: bodyFormat === 'zip' ? undefined : body.toString('utf8'),
    }

    await writeFile(filepath, JSON.stringify(postData, null, 2), 'utf8')
    console.log(`[Proxy] Saved POST body to ${filepath}`)
  } catch (error) {
    console.error('[Proxy] Failed to save POST body:', error)
  }
}
