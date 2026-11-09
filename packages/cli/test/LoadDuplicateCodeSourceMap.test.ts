import { expect, test } from '@jest/globals'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { loadDuplicateCodeSourceMap } from '../src/parts/LoadDuplicateCodeSourceMap/LoadDuplicateCodeSourceMap.ts'
import { root } from '../src/parts/Root/Root.ts'

test('downloads once, reuses its cache, and handles HTTP and size errors without caching failed downloads', async () => {
  const requests: string[] = []
  const contents = '{"version":3,"sources":[],"names":[],"mappings":""}'
  const server = createServer((request, response) => {
    requests.push(request.url!)
    if (request.url === '/missing.map') response.writeHead(404).end()
    else if (request.url === '/oversized.map') response.writeHead(200, { 'Content-Length': 129 * 1024 * 1024 }).end()
    else if (request.url === '/broken.map') {
      response.writeHead(200, { 'Content-Length': 1000 })
      response.flushHeaders()
      setImmediate(() => response.destroy())
    } else response.end(contents)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing server address')
  const base = `http://127.0.0.1:${address.port}`
  const paths = ['/bundle.map', '/missing.map', '/oversized.map', '/broken.map']
  const cachePath = (url: string): string =>
    join(root, '.vscode-source-maps/duplicate-code', createHash('sha256').update(url).digest('hex') + '.map')
  try {
    const reference = { url: base + '/bundle.map' }
    expect(await loadDuplicateCodeSourceMap('unused.js', reference)).toEqual({ contents, url: reference.url })
    expect(await loadDuplicateCodeSourceMap('unused.js', reference)).toEqual({ contents, url: reference.url })
    expect(requests).toEqual(['/bundle.map'])
    await expect(loadDuplicateCodeSourceMap('unused.js', { url: base + '/missing.map' })).rejects.toThrow('HTTP 404')
    await expect(loadDuplicateCodeSourceMap('unused.js', { url: base + '/oversized.map' })).rejects.toThrow('128 MiB')
    await expect(loadDuplicateCodeSourceMap('unused.js', { url: base + '/broken.map' })).rejects.toThrow()
    for (const path of paths.slice(1)) await expect(readFile(cachePath(base + path))).rejects.toMatchObject({ code: 'ENOENT' })
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    for (const path of paths) await rm(cachePath(base + path), { force: true })
  }
})
