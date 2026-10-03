import type { AddressInfo } from 'node:net'
import { afterEach, expect, test } from '@jest/globals'
import JSZip from 'jszip'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { restoreZipArchive } from '../src/parts/RestoreZipArchive/RestoreZipArchive.ts'

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
  zip.file('.vscode-requests/editor-open/0.json', '{"ok":true}')
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

test('restoreZipArchive restores zipped proxy artifacts into the target directory', async () => {
  const zipContent = await createZip()
  const server = await createTestServer(zipContent, 'download-token')
  const targetDir = await mkdtemp(join(tmpdir(), 'restored-requests-'))

  try {
    await restoreZipArchive({
      archiveLabel: 'vscode requests',
      downloadToken: 'download-token',
      downloadUrl: `${server.url}/snapshot.zip`,
      targetDir,
    })

    const requestBody = await readFile(join(targetDir, 'editor-open', '0.json'), 'utf8')
    expect(requestBody).toBe('{"ok":true}')
  } finally {
    await rm(targetDir, { force: true, recursive: true })
  }
})
