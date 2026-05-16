import { afterEach, expect, test } from '@jest/globals'
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

test('getMockResponse - does not fall back to shared root mock files', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(mockRootDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(mockRootDir, mockFileName),
    JSON.stringify({ response: { body: 'root-body', headers: { 'content-type': 'text/plain' }, statusCode: 200 } }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://example.com/api/data')

  expect(result).toBeNull()
})
