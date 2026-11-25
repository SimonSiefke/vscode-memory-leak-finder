import { createServer, type Server } from 'node:http'
import type { TestContext } from '../types.ts'

export const skip = 1

// Requests stay on loopback. Like the other browser scenarios, this keeps default sweeps from running it;
// the integrated browser's HTTP sign-in prompt needs VS Code 1.148 or later.
export const requiresNetwork = true

interface ObservedRequest {
  readonly authorization: string | undefined
  readonly url: string
}

interface AuthServer {
  readonly close: () => Promise<void>
  readonly expectedAuthorization: string
  readonly origin: string
  readonly requests: ObservedRequest[]
}

let iteration = 0
let activeServer: AuthServer | undefined

const escapeRegExp = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const createAuthServer = async ({
  iteration,
  password,
  username,
}: {
  iteration: number
  password: string
  username: string
}): Promise<AuthServer> => {
  const expectedAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  const requests: ObservedRequest[] = []
  const server: Server = createServer((request, response) => {
    const url = request.url || '/'
    const { authorization } = request.headers
    requests.push({ authorization, url })
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    if (url === '/public') {
      response.statusCode = 200
      response.end('<html><head><title>Public fixture</title></head><body><h1>Public fixture</h1></body></html>')
      return
    }
    if (url === '/protected') {
      if (authorization === expectedAuthorization) {
        response.statusCode = 200
        response.end(`<html><head><title>Protected fixture</title></head><body><h1>Protected content ${iteration}</h1></body></html>`)
        return
      }
      response.statusCode = 401
      response.setHeader('WWW-Authenticate', `Basic realm="memory-leak-finder-${iteration}"`)
      response.end('<html><head><title>Unauthorized fixture</title></head><body><h1>Unauthorized fixture</h1></body></html>')
      return
    }
    response.statusCode = 404
    response.end('<html><body><h1>Not found</h1></body></html>')
  })
  const listening = Promise.withResolvers<void>()
  server.once('error', listening.reject)
  // A fresh ephemeral port per cycle keeps Chromium's per-origin credential cache out of the next cycle.
  server.listen(0, '127.0.0.1', () => listening.resolve())
  await listening.promise
  const address = server.address()
  if (!address || typeof address === 'string') {
    server.close()
    throw new Error('Failed to determine auth fixture server port')
  }
  return {
    async close() {
      const closed = Promise.withResolvers<void>()
      server.close(() => closed.resolve())
      server.closeAllConnections()
      await closed.promise
    },
    expectedAuthorization,
    origin: `http://127.0.0.1:${address.port}`,
    requests,
  }
}

const closeActiveServer = async (): Promise<void> => {
  const server = activeServer
  activeServer = undefined
  if (server) {
    await server.close()
  }
}

const waitForWebContentsToBeDisposed = async (Electron: TestContext['Electron'], ids: readonly number[]): Promise<void> => {
  const deadline = performance.now() + 10_000
  while (true) {
    const remaining = (await Electron.getAllWebContents()).filter((entry) => ids.includes(entry.id))
    if (remaining.length === 0) {
      return
    }
    if (performance.now() > deadline) {
      throw new Error(
        `Expected browser web contents to be disposed, still found ${remaining.map((entry) => `${entry.id}:${entry.url}`).join(', ')}`,
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
}

export const run = async ({ Editor, Electron, SimpleBrowser }: TestContext): Promise<void> => {
  iteration++
  const username = `user-${iteration}`
  const password = `pass-${iteration}`
  const server = await createAuthServer({ iteration, password, username })
  activeServer = server
  try {
    const publicUrl = `${server.origin}/public`
    const protectedUrl = `${server.origin}/protected`
    const protectedUrlPattern = new RegExp(`^${escapeRegExp(protectedUrl)}$`)
    const existingWebContentsIds = new Set((await Electron.getAllWebContents()).map((entry) => entry.id))

    await SimpleBrowser.show({ url: publicUrl })
    await SimpleBrowser.shouldHaveText({
      selector: 'h1',
      text: 'Public fixture',
      urlPattern: new RegExp(`^${escapeRegExp(publicUrl)}$`),
    })
    const browserWebContentsIds = (await Electron.getAllWebContents())
      .map((entry) => entry.id)
      .filter((id) => !existingWebContentsIds.has(id))
    if (browserWebContentsIds.length === 0) {
      throw new Error('Expected the integrated browser to create web contents')
    }

    // Cancelling the prompt lets Chromium render the server's 401 body.
    await SimpleBrowser.navigateIntegratedBrowser({ url: protectedUrl, waitForContentFrame: false })
    await SimpleBrowser.shouldHaveAuthPrompt({ origin: server.origin })
    await SimpleBrowser.cancelAuthPrompt()
    await SimpleBrowser.shouldNotHaveAuthPrompt()
    await SimpleBrowser.shouldHaveText({
      selector: 'h1',
      text: 'Unauthorized fixture',
      urlPattern: protectedUrlPattern,
    })
    const protectedRequests = server.requests.filter((request) => request.url === '/protected')
    if (protectedRequests.length === 0) {
      throw new Error('Expected the protected page to be requested')
    }
    if (protectedRequests.some((request) => request.authorization !== undefined)) {
      throw new Error('Expected no credentials to be sent after cancelling the sign-in prompt')
    }

    // Signing in retries the request with the entered Basic credentials.
    const requestCountBeforeSignIn = server.requests.length
    await SimpleBrowser.navigateIntegratedBrowser({ url: protectedUrl, waitForContentFrame: false })
    await SimpleBrowser.shouldHaveAuthPrompt({ origin: server.origin })
    await SimpleBrowser.submitAuthPrompt({ password, username })
    await SimpleBrowser.shouldNotHaveAuthPrompt()
    await SimpleBrowser.shouldHaveText({
      selector: 'h1',
      text: `Protected content ${iteration}`,
      urlPattern: protectedUrlPattern,
    })
    const signInRequests = server.requests.slice(requestCountBeforeSignIn).filter((request) => request.url === '/protected')
    if (!signInRequests.some((request) => request.authorization === server.expectedAuthorization)) {
      throw new Error(`Expected the protected page to be requested with ${server.expectedAuthorization}`)
    }
    if (signInRequests.some((request) => request.authorization !== undefined && request.authorization !== server.expectedAuthorization)) {
      throw new Error('Expected only the entered credentials to be sent')
    }

    await Editor.closeAll()
    await SimpleBrowser.shouldNotHaveAuthPrompt()
    await waitForWebContentsToBeDisposed(Electron, browserWebContentsIds)
    console.log('integrated-browser-basic-auth-prompt:cycle', {
      authorizedProtectedRequests: signInRequests.filter((request) => request.authorization !== undefined).length,
      disposedWebContentsIds: browserWebContentsIds,
      iteration,
      unauthorizedProtectedRequests: protectedRequests.length,
    })
  } finally {
    await closeActiveServer()
  }
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.shouldNotHaveAuthPrompt()
  await closeActiveServer()
}
