import type { Server, IncomingMessage, ServerResponse } from 'http'
import { createServer } from 'http'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { transformCode } from '../Transform/Transform.ts'

let httpServer: Server | null = null

interface CacheMetadata {
  readonly sourceHash: string
  readonly sourcePath: string
  readonly trackingMode: string
}

const cacheRoot = join(process.cwd(), '.vscode-workbench-tracked-modules')

const getCacheKey = (sourcePath: string, trackingMode: string): string => {
  return createHash('sha256').update(`${trackingMode}\n${sourcePath}`).digest('hex')
}

const getCachePaths = (sourcePath: string, trackingMode: string) => {
  const key = getCacheKey(sourcePath, trackingMode)
  return {
    metadataPath: join(cacheRoot, `${key}.json`),
    transformedPath: join(cacheRoot, `${key}.js`),
  }
}

const getSourceHash = (code: string): string => {
  return createHash('sha256').update(code).digest('hex')
}

const getMetadata = (sourcePath: string, trackingMode: string, code: string): CacheMetadata => {
  return {
    sourceHash: getSourceHash(code),
    sourcePath,
    trackingMode,
  }
}

const readMetadata = async (metadataPath: string): Promise<CacheMetadata | undefined> => {
  try {
    return JSON.parse(await readFile(metadataPath, 'utf8'))
  } catch {
    return undefined
  }
}

const isMetadataEqual = (actual: CacheMetadata | undefined, expected: CacheMetadata): boolean => {
  return (
    actual?.sourceHash === expected.sourceHash &&
    actual?.sourcePath === expected.sourcePath &&
    actual?.trackingMode === expected.trackingMode
  )
}

export const transformFile = async (sourcePath: string, trackingMode: string): Promise<string> => {
  const code = await readFile(sourcePath, 'utf8')
  const metadata = getMetadata(sourcePath, trackingMode, code)
  const { metadataPath, transformedPath } = getCachePaths(sourcePath, trackingMode)
  const cachedMetadata = await readMetadata(metadataPath)
  if (isMetadataEqual(cachedMetadata, metadata)) {
    try {
      return await readFile(transformedPath, 'utf8')
    } catch {
      // Regenerate below if transformed output is missing.
    }
  }

  const transformed = await transformCode(code, {
    filename: sourcePath,
    minify: true,
    trackingMode,
  })
  await mkdir(dirname(transformedPath), { recursive: true })
  await Promise.all([writeFile(transformedPath, transformed), writeFile(metadataPath, JSON.stringify(metadata, null, 2))])
  return transformed
}

const getTransformOptions = (req: IncomingMessage): { readonly sourcePath: string; readonly trackingMode: string } | undefined => {
  if (!req.url) {
    return undefined
  }
  const url = new URL(req.url, 'http://127.0.0.1')
  if (url.pathname !== '/transform') {
    return undefined
  }
  const sourcePath = url.searchParams.get('filePath') || ''
  const trackingMode = url.searchParams.get('trackingMode') || 'functions'
  if (!sourcePath) {
    return undefined
  }
  return {
    sourcePath,
    trackingMode,
  }
}

export const startServer = async (port: number): Promise<void> => {
  // If server is already running, don't start again
  if (httpServer) {
    console.log(`[HttpServer] Server already running on port ${port}`)
    return
  }

  const { promise, reject, resolve } = Promise.withResolvers<void>()

  httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const transformOptions = getTransformOptions(req)
    if (!transformOptions) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
      return
    }
    try {
      const transformed = await transformFile(transformOptions.sourcePath, transformOptions.trackingMode)
      res.writeHead(200, {
        'Content-Type': 'application/javascript',
      })
      res.end(transformed)
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(error instanceof Error ? error.stack || error.message : String(error))
    }
  })

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    // If port is already in use, try to reuse existing server
    if (error.code === 'EADDRINUSE') {
      console.log(`[HttpServer] Port ${port} already in use, assuming server is already running`)
      httpServer = null
      resolve()
      return
    }
    console.error('[HttpServer] Server error:', error)
    reject(error)
  })

  httpServer.listen(port, () => {
    console.log(`[FunctionTracker] HTTP server listening on port ${port}`)
    resolve()
  })

  await promise
}

export const stopServer = async (): Promise<void> => {
  if (httpServer) {
    const { promise, resolve } = Promise.withResolvers<void>()
    httpServer.close(() => {
      httpServer = null
      resolve()
    })
    await promise
  }
}
