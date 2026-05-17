import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetMockFileName from '../src/parts/GetMockFileName/GetMockFileName.ts'
import * as GetMockResponse from '../src/parts/GetMockResponse/GetMockResponse.ts'
import * as ProxyState from '../src/parts/ProxyState/ProxyState.ts'
import * as Root from '../src/parts/Root/Root.ts'

const testFolderName = 'proxy-test-get-mock-response'
const mockRootDir = join(Root.root, '.vscode-mock-requests')
const scopedMockDir = join(mockRootDir, testFolderName)

afterEach(async () => {
  jest.restoreAllMocks()
  ProxyState.setTestFolderName('')
  await rm(scopedMockDir, { force: true, recursive: true })
  const rootMockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await rm(join(mockRootDir, rootMockFileName), { force: true })
})

test('getMockResponse - returns mock from active test folder', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({ response: { body: 'scoped-body', headers: { 'content-type': 'text/plain' }, statusCode: 200 } }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://example.com/api/data')

  expect(result).toEqual({
    body: 'scoped-body',
    headers: { 'content-type': 'text/plain' },
    statusCode: 200,
  })
})

test('getMockResponse - falls back to shared root mock files when scoped mock is missing', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(mockRootDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(mockRootDir, mockFileName),
    JSON.stringify({ response: { body: 'root-body', headers: { 'content-type': 'text/plain' }, statusCode: 200 } }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://example.com/api/data')

  expect(result).toEqual({
    body: 'root-body',
    headers: { 'content-type': 'text/plain' },
    statusCode: 200,
  })
})

test('getMockResponse - refreshes copilot token timestamps for existing json mocks', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      metadata: { responseType: 'json' },
      response: {
        body: {
          expires_at: 1_700_000_123,
          iat: 1_700_000_456,
          token: 'tid=abc;exp=789;iat=111;sku=plus_monthly_subscriber_quota',
        },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://example.com/api/data')

  expect(result).toEqual({
    body: JSON.stringify({
      expires_at: 1_831_536_000,
      iat: 1_800_000_000,
      token: 'tid=abc;exp=1831536000;iat=1800000000;sku=plus_monthly_subscriber_quota',
    }),
    headers: { 'content-type': 'application/json' },
    statusCode: 200,
  })
})
