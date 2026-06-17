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

test('saveMockFile - sanitizes signed nltoken payloads and telemetry ids', async () => {
  ProxyState.setTestFolderName(testFolderName)

  await SaveMockFile.saveMockFile({
    method: 'GET',
    response: {
      body: {
        expires_at: 1_779_188_904,
        iat: 1_779_188_544,
        token:
          'tid=46715932-deba-4a20-b208-76991b6e7545;exp=1779188904;sku=no_auth_limited_copilot;proxy-ep=proxy.individual.githubcopilot.com;st=dotcom;chat=1;malfil=1;agent_mode=1;mcp=1;ip=91.54.213.52;asn=AS3320:d5d78b88e6c4a25306aa7cb0cfcc83d9845bf9236635704dc9c6ed751054007f',
        tracking_id: '46715932-deba-4a20-b208-76991b6e7545',
      },
      headers: {
        activityid: 'f39825f4-417f-4f63-b75e-9e76656071a4',
        'content-type': 'application/json',
        'request-context': 'appId=cid-v1:84715e31-583a-4723-a46d-946169b2f4a8',
        'x-tfs-session': 'f39825f4-417f-4f63-b75e-9e76656071a4',
        'x-vss-e2eid': 'f39825f4-417f-4f63-b75e-9e76656071a4',
      },
      statusCode: 200,
      statusMessage: 'OK',
    },
    responseType: 'json',
    timestamp: 123,
    url: 'https://api.github.com/copilot_internal/v2/nltoken',
  })

  const mockFileName = await GetMockFileName.getMockFileName('api.github.com', '/copilot_internal/v2/nltoken', 'GET')
  const content = await readFile(join(scopedMockDir, mockFileName), 'utf8')

  expect(JSON.parse(content)).toEqual({
    metadata: {
      responseType: 'json',
      timestamp: 123,
    },
    request: {
      body: undefined,
      method: 'GET',
      url: 'https://api.github.com/copilot_internal/v2/nltoken',
    },
    response: {
      body: {
        expires_at: 4_102_444_800,
        iat: 1_700_000_000,
        token:
          'tid=00000000-0000-4000-8000-000000000001;exp=4102444800;sku=no_auth_limited_copilot;proxy-ep=proxy.individual.githubcopilot.com;st=dotcom;chat=1;malfil=1;agent_mode=1;mcp=1;ip=203.0.113.10;asn=AS65500:mock',
        tracking_id: '00000000-0000-4000-8000-000000000001',
      },
      headers: {
        activityid: '00000000-0000-4000-8000-000000000010',
        'content-type': 'application/json',
        'request-context': 'appId=cid-v1:00000000-0000-4000-8000-000000000014',
        'x-tfs-session': '00000000-0000-4000-8000-000000000011',
        'x-vss-e2eid': '00000000-0000-4000-8000-000000000012',
      },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })
})

test('saveMockFile - replaces absolute root and workspace paths with placeholders', async () => {
  ProxyState.setTestFolderName(testFolderName)
  const workspaceFilePath = join(Root.root, '.vscode-test-workspace', 'test', 'add.test.js')
  const sseFilePath = join(Root.root, '.vscode-sse-data', testFolderName, 'fixture.txt')

  await SaveMockFile.saveMockFile({
    method: 'POST',
    requestBody: {
      filePath: workspaceFilePath,
    },
    response: {
      body: `file-reference:${sseFilePath}`,
      headers: { 'content-type': 'text/event-stream' },
      statusCode: 200,
      statusMessage: 'OK',
    },
    responseType: 'sse',
    timestamp: 123,
    url: 'https://example.com/api/data',
  })

  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'POST', {
    filePath: workspaceFilePath,
  })
  const content = await readFile(join(scopedMockDir, mockFileName), 'utf8')

  expect(JSON.parse(content)).toEqual({
    metadata: {
      responseType: 'sse',
      timestamp: 123,
    },
    request: {
      body: {
        filePath: '@@WORKSPACE_PATH@@/test/add.test.js',
      },
      method: 'POST',
      url: 'https://example.com/api/data',
    },
    response: {
      body: `file-reference:@@ROOT_PATH@@/.vscode-sse-data/${testFolderName}/fixture.txt`,
      headers: { 'content-type': 'text/event-stream' },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })
})
