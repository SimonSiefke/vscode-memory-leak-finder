import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { afterEach, expect, test } from '@jest/globals'
import { handleHomePageRequest } from '../src/parts/HomePage/HomePage.ts'

type TestServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const servers: TestServer[] = []

const createTestServer = async (): Promise<TestServer> => {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const handled = handleHomePageRequest(request, response)
    if (!handled) {
      response.writeHead(404)
      response.end()
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve()
    })
  })

  const { port } = server.address() as AddressInfo
  const testServer = {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
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

test('homepage handler serves an html overview at root', async () => {
  const server = await createTestServer()

  const response = await fetch(server.url)
  const text = await response.text()

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('text/html')
  expect(text).toContain('<title>VS Code Memory Leak Finder Bot</title>')
  expect(text).toContain('GitHub App bot for on-demand memory leak measurements')
  expect(text).toContain('/api/github/webhooks')
})
