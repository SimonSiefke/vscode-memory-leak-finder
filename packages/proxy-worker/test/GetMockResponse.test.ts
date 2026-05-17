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
  const copilotRequestBody = { prompt: 'hello' }
  const copilotMockFileName = await GetMockFileName.getMockFileName(
    'api.individual.githubcopilot.com',
    '/chat/completions',
    'POST',
    copilotRequestBody,
  )
  await rm(join(mockRootDir, copilotMockFileName), { force: true })
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

test('getMockResponse - preserves signed copilot token payloads for existing json mocks', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      metadata: { responseType: 'json' },
      response: {
        body: {
          expires_at: 1_831_536_000,
          iat: 1_800_000_000,
          token: 'tid=abc;exp=1831536000;iat=1800000000;sku=plus_monthly_subscriber_quota',
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

test('getMockResponse - skips expired signed copilot token payloads', async () => {
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
          token: 'tid=abc;exp=1700000123;iat=1700000456;sku=plus_monthly_subscriber_quota',
        },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://example.com/api/data')

  expect(result).toBeNull()
})

test('getMockResponse - skips poisoned keyed copilot mocks and falls back to a valid shared mock', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  await mkdir(mockRootDir, { recursive: true })
  const requestBody = { prompt: 'hello' }
  const mockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/chat/completions', 'POST', requestBody)

  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      response: {
        body: 'IDE token expired: unauthorized: token expired\n',
        headers: { 'content-type': 'text/plain' },
        statusCode: 401,
      },
    }),
    'utf8',
  )

  await writeFile(
    join(mockRootDir, mockFileName),
    JSON.stringify({
      response: {
        body: 'shared-body',
        headers: { 'content-type': 'text/plain' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('POST', 'https://api.individual.githubcopilot.com/chat/completions', requestBody)

  expect(result).toEqual({
    body: 'shared-body',
    headers: { 'content-type': 'text/plain' },
    statusCode: 200,
  })
})

test('getMockResponse - skips poisoned model mocks so the request can fall through live', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('proxy.individual.githubcopilot.com', '/models', 'GET')

  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      response: {
        body: 'unauthorized: invalid token: cannot validate HMAC\n',
        headers: { 'content-type': 'text/plain' },
        statusCode: 401,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://proxy.individual.githubcopilot.com/models')

  expect(result).toBeNull()
})
