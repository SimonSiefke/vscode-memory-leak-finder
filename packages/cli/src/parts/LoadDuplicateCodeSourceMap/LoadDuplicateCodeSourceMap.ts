import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { SourceMapReference } from '../DuplicateCode/DuplicateCode.ts'
import { root } from '../Root/Root.ts'

// Bound compressed and uncompressed downloads alike; fetching is streamed to disk.
const maxMapBytes = 128 * 1024 * 1024
const assertSize = (size: number): void => {
  if (size > maxMapBytes) throw new Error('Source map exceeds the 128 MiB size limit')
}

const downloadMap = async (url: URL): Promise<string> => {
  const cache = join(root, '.vscode-source-maps', 'duplicate-code')
  const path = join(cache, createHash('sha256').update(url.href).digest('hex') + '.map')
  try {
    assertSize((await stat(path)).size)
    return path
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  try {
    if (!response.ok) throw new Error(`Source map request returned HTTP ${response.status}`)
    assertSize(Number(response.headers.get('content-length') || 0))
  } catch (error) {
    await response.body?.cancel()
    throw error
  }
  if (!response.body) throw new Error('Empty source map response')
  await mkdir(cache, { recursive: true })
  const temporary = path + '.' + randomUUID() + '.tmp'
  let bytes = 0
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length
      callback(bytes > maxMapBytes ? new Error('Source map exceeds the 128 MiB size limit') : null, chunk)
    },
  })
  try {
    await pipeline(Readable.fromWeb(response.body), limit, createWriteStream(temporary, { flags: 'wx' }))
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
  return path
}

export const loadDuplicateCodeSourceMap = async (
  file: string,
  reference?: SourceMapReference,
): Promise<{ contents: string; url: string }> => {
  let url: URL
  if (reference && 'start' in reference) {
    // Acorn offsets are UTF-16 offsets, so decode the bundle before slicing.
    const comment = (await readFile(file, 'utf8')).slice(reference.start, reference.end)
    const match = /[#@]\s*sourceMappingURL=(\S+)/.exec(comment)
    if (!match) throw new Error('Inline source map directive was not found')
    assertSize(match[1].length)
    url = new URL(match[1])
  } else {
    url = reference ? new URL(reference.url, pathToFileURL(file)) : pathToFileURL(file + '.map')
  }
  if (url.protocol === 'data:') {
    const match = /^data:application\/json(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i.exec(url.href)
    if (!match) throw new Error('Unsupported inline source map encoding')
    const contents = match[1] ? Buffer.from(match[2], 'base64').toString('utf8') : decodeURIComponent(match[2])
    assertSize(Buffer.byteLength(contents))
    return { contents, url: 'inline' }
  }
  const path =
    url.protocol === 'file:'
      ? fileURLToPath(url)
      : url.protocol === 'https:' || url.protocol === 'http:'
        ? await downloadMap(url)
        : undefined
  if (!path) throw new Error(`Unsupported source map protocol: ${url.protocol}`)
  assertSize((await stat(path)).size)
  return { contents: await readFile(path, 'utf8'), url: url.href }
}
