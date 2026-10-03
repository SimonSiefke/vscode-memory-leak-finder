import type { AddressInfo } from 'node:net'
import { afterEach, expect, test } from '@jest/globals'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { handleHealthRequest } from '../src/parts/HandleHealthRequest/HandleHealthRequest.ts'

type TestServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const servers: TestServer[] = []

const createTestServer = async (): Promise<TestServer> => {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const handled = handleHealthRequest(request, response)
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

test('health handler serves a json response at /health', async () => {
  const server = await createTestServer()

  const response = await fetch(`${server.url}/health`)
  const body = (await response.json()) as { readonly ok: boolean }

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(body).toEqual({ ok: true })
})

test('health handler ignores unsupported methods', async () => {
  const server = await createTestServer()

  const response = await fetch(`${server.url}/health`, {
    method: 'POST',
  })

  expect(response.status).toBe(404)
})

test('health handler responds to head requests', async () => {
  const server = await createTestServer()

  const response = await fetch(`${server.url}/health`, {
    method: 'HEAD',
  })

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('application/json')
})
