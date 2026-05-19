import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from '@jest/globals'
import JSZip from 'jszip'
import { createNodeMiddleware, Probot } from 'probot'
import { createApp } from '../src/parts/App/App.ts'
import { readUserDataSnapshotMetadata } from '../src/parts/UserDataSnapshot/UserDataSnapshot.ts'

type TestServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const servers: TestServer[] = []

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
  zip.file('.vscode-user-data-dir/User/globalStorage/state.json', '{"signedIn":true}')
  return zip.generateAsync({ type: 'nodebuffer' })
}

const createTestServer = async (storagePath: string, publicBaseUrl = ''): Promise<TestServer> => {
  const middleware = await createNodeMiddleware(
    createApp({
      allowedLogins: ['SimonSiefke'],
      publicBaseUrl,
      userDataStoragePath: storagePath,
      userDataUploadToken: 'shared-upload-token',
      workflowFileName: 'measure-on-demand.yml',
      workflowOwner: 'SimonSiefke',
      workflowRef: 'main',
      workflowRepo: 'vscode-memory-leak-finder',
    }),
    {
      probot: new Probot({
        appId: 1,
        privateKey:
          '-----BEGIN PRIVATE KEY-----\nMIIBVwIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEArandomkeyexample\n-----END PRIVATE KEY-----',
        secret: 'test-secret',
      }),
    },
  )
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    return middleware(request, response, () => {
      response.statusCode = 404
      response.end('Not Found')
    })
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

test('upload route stores snapshot and download route returns it', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const server = await createTestServer(storagePath)
  const zip = await createZip()

  try {
    const uploadResponse = await fetch(`${server.url}/api/user-data/upload`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer shared-upload-token',
        'content-type': 'application/zip',
      },
      body: zip,
    })
    expect(uploadResponse.status).toBe(201)
    const uploadResult = (await uploadResponse.json()) as {
      readonly downloadUserDataZipFileUrl: string
    }
    expect(uploadResult.downloadUserDataZipFileUrl).toBe(`${server.url}/api/user-data/download`)
    expect(uploadResult).toEqual({
      downloadUserDataZipFileUrl: `${server.url}/api/user-data/download`,
    })
    const metadata = await readUserDataSnapshotMetadata(storagePath)
    expect(metadata).toBeDefined()

    const downloadResponse = await fetch(uploadResult.downloadUserDataZipFileUrl, {
      headers: {
        authorization: `Bearer ${metadata?.downloadToken || ''}`,
      },
    })
    expect(downloadResponse.status).toBe(200)
    const downloadedZip = Buffer.from(await downloadResponse.arrayBuffer())
    const extracted = await JSZip.loadAsync(downloadedZip)
    expect(Object.keys(extracted.files)).toContain('.vscode-user-data-dir/User/settings.json')
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})

test('upload route returns the configured public base url for download links', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const server = await createTestServer(storagePath, 'https://bot-tunnel.example.com')
  const zip = await createZip()

  try {
    const uploadResponse = await fetch(`${server.url}/api/user-data/upload`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer shared-upload-token',
        'content-type': 'application/zip',
      },
      body: zip,
    })
    expect(uploadResponse.status).toBe(201)
    const uploadResult = (await uploadResponse.json()) as {
      readonly downloadUserDataZipFileUrl: string
    }
    expect(uploadResult).toEqual({
      downloadUserDataZipFileUrl: 'https://bot-tunnel.example.com/api/user-data/download',
    })
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})

test('upload route rejects invalid credentials', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const server = await createTestServer(storagePath)
  const zip = await createZip()

  try {
    const invalidTokenResponse = await fetch(`${server.url}/api/user-data/upload`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer invalid-token',
        'content-type': 'application/zip',
      },
      body: zip,
    })
    expect(invalidTokenResponse.status).toBe(401)
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})

test('upload route returns service unavailable when upload token is not configured', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const middleware = await createNodeMiddleware(
    createApp({
      allowedLogins: ['SimonSiefke'],
      publicBaseUrl: '',
      userDataStoragePath: storagePath,
      userDataUploadToken: '',
      workflowFileName: 'measure-on-demand.yml',
      workflowOwner: 'SimonSiefke',
      workflowRef: 'main',
      workflowRepo: 'vscode-memory-leak-finder',
    }),
    {
      probot: new Probot({
        appId: 1,
        privateKey:
          '-----BEGIN PRIVATE KEY-----\nMIIBVwIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEArandomkeyexample\n-----END PRIVATE KEY-----',
        secret: 'test-secret',
      }),
    },
  )
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    return middleware(request, response, () => {
      response.statusCode = 404
      response.end('Not Found')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address() as AddressInfo
  const testServer = {
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    url: `http://127.0.0.1:${address.port}`,
  }
  servers.push(testServer)
  const zip = await createZip()

  try {
    const uploadResponse = await fetch(`${testServer.url}/api/user-data/upload`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer anything',
        'content-type': 'application/zip',
      },
      body: zip,
    })
    expect(uploadResponse.status).toBe(503)
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})

test('download route rejects invalid bearer token', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const server = await createTestServer(storagePath)
  const zip = await createZip()

  try {
    const uploadResponse = await fetch(`${server.url}/api/user-data/upload`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer shared-upload-token',
        'content-type': 'application/zip',
      },
      body: zip,
    })
    expect(uploadResponse.status).toBe(201)

    const downloadResponse = await fetch(`${server.url}/api/user-data/download`, {
      headers: {
        authorization: 'Bearer wrong-token',
      },
    })
    expect(downloadResponse.status).toBe(401)
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})

test('download route accepts the shared upload token', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const server = await createTestServer(storagePath)
  const zip = await createZip()

  try {
    const uploadResponse = await fetch(`${server.url}/api/user-data/upload`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer shared-upload-token',
        'content-type': 'application/zip',
      },
      body: zip,
    })
    expect(uploadResponse.status).toBe(201)

    const downloadResponse = await fetch(`${server.url}/api/user-data/download`, {
      headers: {
        authorization: 'Bearer shared-upload-token',
      },
    })
    expect(downloadResponse.status).toBe(200)
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})
