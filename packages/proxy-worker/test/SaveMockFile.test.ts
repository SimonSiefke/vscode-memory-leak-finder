import { afterEach, expect, test } from '@jest/globals'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetMockFileName from '../src/parts/GetMockFileName/GetMockFileName.ts'
import * as ProxyState from '../src/parts/ProxyState/ProxyState.ts'
import * as Root from '../src/parts/Root/Root.ts'
import * as SaveMockFile from '../src/parts/SaveMockFile/SaveMockFile.ts'

const testFolderName = 'proxy-test-save-mock-file'
const mockRootDir = join(Root.root, '.vscode-mock-requests')
const scopedMockDir = join(mockRootDir, testFolderName)

afterEach(async () => {
  ProxyState.setTestFolderName('')
  await rm(scopedMockDir, { force: true, recursive: true })
})

test('saveMockFile - writes the mock into the active test folder', async () => {
  ProxyState.setTestFolderName(testFolderName)

  await SaveMockFile.saveMockFile({
    method: 'POST',
    requestBody: { prompt: 'hello' },
    response: {
      body: { ok: true },
      headers: { 'content-type': 'application/json' },
      statusCode: 200,
      statusMessage: 'OK',
    },
    responseType: 'json',
    timestamp: 123,
    url: 'https://example.com/api/data',
  })

  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'POST', { prompt: 'hello' })
  const content = await readFile(join(scopedMockDir, mockFileName), 'utf8')

  expect(JSON.parse(content)).toEqual({
    metadata: {
      responseType: 'json',
      timestamp: 123,
    },
    request: {
      body: { prompt: 'hello' },
      method: 'POST',
      url: 'https://example.com/api/data',
    },
    response: {
      body: { ok: true },
      headers: { 'content-type': 'application/json' },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })
})

test('saveMockFile - keeps an existing successful mock when a later expired-token 401 is recorded', async () => {
  ProxyState.setTestFolderName(testFolderName)
  const requestBody = { prompt: 'hello' }

  await SaveMockFile.saveMockFile({
    method: 'POST',
    requestBody,
    response: {
      body: { ok: true },
      headers: { 'content-type': 'application/json' },
      statusCode: 200,
      statusMessage: 'OK',
    },
    responseType: 'json',
    timestamp: 123,
    url: 'https://api.individual.githubcopilot.com/chat/completions',
  })

  await SaveMockFile.saveMockFile({
    method: 'POST',
    requestBody,
    response: {
      body: 'IDE token expired: unauthorized: token expired\n',
      headers: { 'content-type': 'text/plain' },
      statusCode: 401,
      statusMessage: 'Unauthorized',
    },
    responseType: 'text',
    timestamp: 456,
    url: 'https://api.individual.githubcopilot.com/chat/completions',
  })

  const mockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/chat/completions', 'POST', requestBody)
  const content = await readFile(join(scopedMockDir, mockFileName), 'utf8')

  expect(JSON.parse(content)).toEqual({
    metadata: {
      responseType: 'json',
      timestamp: 123,
    },
    request: {
      body: requestBody,
      method: 'POST',
      url: 'https://api.individual.githubcopilot.com/chat/completions',
    },
    response: {
      body: { ok: true },
      headers: { 'content-type': 'application/json' },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })
})
