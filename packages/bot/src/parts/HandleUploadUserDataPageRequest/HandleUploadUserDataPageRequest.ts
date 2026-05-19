import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'

type AssetDefinition = {
  readonly contentType: string
  readonly url: URL
}

const assetDefinitions: Record<string, AssetDefinition> = {
  '/upload-user-data-dir': {
    contentType: 'text/html; charset=utf-8',
    url: new URL('./static/upload-user-data-dir.html', import.meta.url),
  },
  '/upload-user-data-dir/upload.css': {
    contentType: 'text/css; charset=utf-8',
    url: new URL('./static/upload.css', import.meta.url),
  },
  '/upload-user-data-dir/upload.js': {
    contentType: 'text/javascript; charset=utf-8',
    url: new URL('./static/upload.js', import.meta.url),
  },
}

const assetCache = new Map<string, Promise<Buffer>>()

const readAsset = (path: string): Promise<Buffer> => {
  let cached = assetCache.get(path)
  if (!cached) {
    cached = readFile(assetDefinitions[path].url)
    assetCache.set(path, cached)
  }
  return cached
}

export const handleUploadUserDataPageRequest = (request: IncomingMessage, response: ServerResponse): boolean => {
  if (request.method !== 'GET') {
    return false
  }
  const path = request.url?.split('?')[0] ?? ''
  const asset = assetDefinitions[path]
  if (!asset) {
    return false
  }
  void readAsset(path)
    .then((contents) => {
      response.writeHead(200, {
        'content-type': asset.contentType,
      })
      response.end(contents)
    })
    .catch((error) => {
      response.writeHead(500, {
        'content-type': 'application/json; charset=utf-8',
      })
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
    })
  return true
}
