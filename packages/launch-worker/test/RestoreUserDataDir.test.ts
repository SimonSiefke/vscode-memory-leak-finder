import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, jest, test } from '@jest/globals'
import JSZip from 'jszip'
import { restoreUserDataDir } from '../src/parts/RestoreUserDataDir/RestoreUserDataDir.ts'

type TestHttpServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const servers: TestHttpServer[] = []
const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

afterEach(async () => {
  logSpy.mockClear()
  while (servers.length > 0) {
    const server = servers.pop()
    if (server) {
      await server.close()
    }
  }
})

const createZip = async (): Promise<Buffer> => {
  const zip = new JSZip()
  zip.file('.vscode-user-data-dir/User/settings.json', '{"window.zoomLevel":1}')
  zip.file('.vscode-user-data-dir/User/globalStorage/state.json', '{"authenticated":true}')
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

const createPublicTestServer = async (zipContent: Buffer): Promise<TestHttpServer> => {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    if (request.headers.authorization) {
      response.statusCode = 400
      response.end('Did not expect authorization header')
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

test('restoreUserDataDir downloads and extracts the snapshot', async () => {
  const zipContent = await createZip()
  const server = await createTestServer(zipContent, 'download-token')
  const userDataDir = await mkdtemp(join(tmpdir(), 'restored-user-data-'))

  try {
    await restoreUserDataDir({
      downloadUserDataZipFileToken: 'download-token',
      downloadUserDataZipFileUrl: `${server.url}/api/user-data/download`,
      userDataDir,
    })

    expect(logSpy).toHaveBeenCalledWith(
      `[repository] restoring user data dir from url ${server.url}/api/user-data/download with token [redacted].`,
    )
    expect(logSpy).toHaveBeenCalledWith('[repository] downloaded user data dir archive, extracting...')
    expect(logSpy).toHaveBeenCalledWith('[repository] restored user data dir successfully.')

    const settings = await readFile(join(userDataDir, 'User', 'settings.json'), 'utf8')
    const state = await readFile(join(userDataDir, 'User', 'globalStorage', 'state.json'), 'utf8')
    expect(settings).toBe('{"window.zoomLevel":1}')
    expect(state).toBe('{"authenticated":true}')
  } finally {
    await rm(userDataDir, { force: true, recursive: true })
  }
})

test('restoreUserDataDir throws when download fails', async () => {
  const zipContent = await createZip()
  const server = await createTestServer(zipContent, 'download-token')
  const userDataDir = await mkdtemp(join(tmpdir(), 'restored-user-data-'))

  try {
    await expect(
      restoreUserDataDir({
        downloadUserDataZipFileToken: 'wrong-token',
        downloadUserDataZipFileUrl: `${server.url}/api/user-data/download`,
        userDataDir,
      }),
    ).rejects.toThrow('Failed to restore user data dir')
  } finally {
    await rm(userDataDir, { force: true, recursive: true })
  }
})

test('restoreUserDataDir downloads public snapshots without an authorization header', async () => {
  const zipContent = await createZip()
  const server = await createPublicTestServer(zipContent)
  const userDataDir = await mkdtemp(join(tmpdir(), 'restored-user-data-'))

  try {
    await restoreUserDataDir({
      downloadUserDataZipFileToken: '',
      downloadUserDataZipFileUrl: `${server.url}/snapshot.zip`,
      userDataDir,
    })

    const settings = await readFile(join(userDataDir, 'User', 'settings.json'), 'utf8')
    expect(settings).toBe('{"window.zoomLevel":1}')
  } finally {
    await rm(userDataDir, { force: true, recursive: true })
  }
})

test('restoreUserDataDir redacts signed query parameters in logs', async () => {
  const zipContent = await createZip()
  const server = await createPublicTestServer(zipContent)
  const userDataDir = await mkdtemp(join(tmpdir(), 'restored-user-data-'))

  try {
    await restoreUserDataDir({
      downloadUserDataZipFileToken: '',
      downloadUserDataZipFileUrl: `${server.url}/snapshot.zip?X-Amz-Signature=secret-signature&X-Amz-Expires=3600`,
      userDataDir,
    })

    expect(logSpy).toHaveBeenCalledWith(
      `[repository] restoring user data dir from url ${server.url}/snapshot.zip?[redacted] with token [redacted].`,
    )
  } finally {
    await rm(userDataDir, { force: true, recursive: true })
  }
})

test('restoreUserDataDir throws contextual error when fetch throws', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = jest.fn(async () => {
    throw new Error('network down')
  }) as typeof fetch
  const userDataDir = await mkdtemp(join(tmpdir(), 'restored-user-data-'))

  try {
    await expect(
      restoreUserDataDir({
        downloadUserDataZipFileToken: 'download-token',
        downloadUserDataZipFileUrl: 'https://example.com/api/user-data/download',
        userDataDir,
      }),
    ).rejects.toThrow('Failed to restore user data dir')
  } finally {
    globalThis.fetch = originalFetch
    await rm(userDataDir, { force: true, recursive: true })
  }
})
