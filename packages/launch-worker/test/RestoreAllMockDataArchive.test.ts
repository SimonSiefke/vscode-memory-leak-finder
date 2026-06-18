import type { AddressInfo } from 'node:net'
import { afterEach, expect, test } from '@jest/globals'
import JSZip from 'jszip'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { restoreAllMockDataArchive } from '../src/parts/RestoreAllMockDataArchive/RestoreAllMockDataArchive.ts'

type TestHttpServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const servers: TestHttpServer[] = []

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop()
    if (server) {
      await server.close()
    }
  }
})

const createZip = async (): Promise<Buffer> => {
  const zip = new JSZip()
  zip.file('.vscode-user-data-dir/User/settings.json', '{"window.zoomLevel":0}')
  zip.file('.vscode-mock-requests/editor-open/0.json', '{"ok":true}')
  zip.file('.vscode-proxy-certs/ca.pem', 'ca-content')
  zip.file('.vscode-sse-data/editor-open/stream.txt', 'event: ping')
  zip.file('.vscode-requests/editor-open/0.json', '{"url":"https://example.com"}')
  return zip.generateAsync({ type: 'nodebuffer' })
}

const createTestServer = async (zipContent: Buffer, expectedToken: string): Promise<TestHttpServer> => {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    if (request.headers.authorization !== `Bearer ${expectedToken}`) {
      response.statusCode = 401
      response.end('Unauthorized')
      return
    }
    response.statusCode = 200
    response.setHeader('content-type', 'application/zip')
    response.end(zipContent)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address() as AddressInfo
  const testServer = {
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    url: `http://127.0.0.1:${address.port}`,
  }
  servers.push(testServer)
  return testServer
}

test('restoreAllMockDataArchive restores all mock data folders from one zip archive', async () => {
  const zipContent = await createZip()
  const server = await createTestServer(zipContent, 'download-token')
  const targetRootDir = await mkdtemp(join(tmpdir(), 'all-mock-data-'))

  try {
    await restoreAllMockDataArchive({
      downloadToken: 'download-token',
      downloadUrl: `${server.url}/all-mock-data.zip`,
      rootDir: targetRootDir,
    })

    const settings = await readFile(join(targetRootDir, '.vscode-user-data-dir', 'User', 'settings.json'), 'utf8')
    const mockRequest = await readFile(join(targetRootDir, '.vscode-mock-requests', 'editor-open', '0.json'), 'utf8')
    const cert = await readFile(join(targetRootDir, '.vscode-proxy-certs', 'ca.pem'), 'utf8')
    const sseData = await readFile(join(targetRootDir, '.vscode-sse-data', 'editor-open', 'stream.txt'), 'utf8')
    const request = await readFile(join(targetRootDir, '.vscode-requests', 'editor-open', '0.json'), 'utf8')

    expect(settings).toBe('{"window.zoomLevel":0}')
    expect(mockRequest).toBe('{"ok":true}')
    expect(cert).toBe('ca-content')
    expect(sseData).toBe('event: ping')
    expect(request).toBe('{"url":"https://example.com"}')
  } finally {
    await rm(targetRootDir, { force: true, recursive: true })
  }
})
