import type { AddressInfo } from 'node:net'
import { afterEach, expect, test } from '@jest/globals'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { handleUploadUserDataPageRequest } from '../src/parts/HandleUploadUserDataPageRequest/HandleUploadUserDataPageRequest.ts'

type TestServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const servers: TestServer[] = []

const createTestServer = async (): Promise<TestServer> => {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const handled = handleUploadUserDataPageRequest(request, response)
    if (!handled) {
      response.writeHead(404)
      response.end()
    }
  })

  const listenPromise = Promise.withResolvers<void>()
  server.listen(0, '127.0.0.1', listenPromise.resolve)
  await listenPromise.promise

  const { port } = server.address() as AddressInfo
  const testServer = {
    close: async () => {
      const closePromise = Promise.withResolvers<void>()
      server.close((error) => {
        if (error) {
          closePromise.reject(error)
          return
        }
        closePromise.resolve()
      })
      await closePromise.promise
    },
    url: `http://127.0.0.1:${port}`,
  }
  servers.push(testServer)
  return testServer
}

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop()
    if (server) {
      await server.close()
    }
  }
})

test('upload user data page serves a browser upload form', async () => {
  const server = await createTestServer()

  const response = await fetch(`${server.url}/upload-user-data-dir`)
  const text = await response.text()

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('text/html')
  expect(text).toContain('<title>Upload VS Code User Data Dir</title>')
  expect(text).toContain('method="post"')
  expect(text).toContain('enctype="multipart/form-data"')
  expect(text).toContain('type="file"')
  expect(text).toContain('/api/user-data/upload')
  expect(text).toContain('Upload token')
  expect(text).toContain('BOT_USER_DATA_UPLOAD_TOKEN')
  expect(text).toContain('/upload-user-data-dir/upload.css')
  expect(text).toContain('/upload-user-data-dir/upload.js')
})

test('upload user data page serves static assets', async () => {
  const server = await createTestServer()

  const cssResponse = await fetch(`${server.url}/upload-user-data-dir/upload.css`)
  const cssText = await cssResponse.text()
  const jsResponse = await fetch(`${server.url}/upload-user-data-dir/upload.js`)
  const jsText = await jsResponse.text()

  expect(cssResponse.status).toBe(200)
  expect(cssResponse.headers.get('content-type')).toContain('text/css')
  expect(cssText).toContain('color-scheme: light')
  expect(jsResponse.status).toBe(200)
  expect(jsResponse.headers.get('content-type')).toContain('text/javascript')
  expect(jsText).toContain("document.getElementById('upload-token')")
  expect(jsText).toContain("fetch('/api/user-data/upload'")
  expect(jsText).toContain("'Upload failed:\\n'")
})
