import { afterEach, expect, test } from '@jest/globals'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as ConvertRequestsToMocks from '../src/parts/ConvertRequestsToMocks/ConvertRequestsToMocks.ts'
import * as GetMockFileName from '../src/parts/GetMockFileName/GetMockFileName.ts'
import * as Root from '../src/parts/Root/Root.ts'

const requestsRootDir = join(Root.root, '.vscode-requests')
const mocksRootDir = join(Root.root, '.vscode-mock-requests')
const firstTestFolderName = 'proxy-test-convert-a'
const secondTestFolderName = 'proxy-test-convert-b'
const expiredTokenTestFolderName = 'proxy-test-convert-expired-token'
const pathPlaceholderTestFolderName = 'proxy-test-convert-paths'
const tokenTestFolderName = 'proxy-test-convert-token'

const writeRecordedRequest = async (testFolderName: string, body: string, timestamp: number): Promise<void> => {
  const requestsDir = join(requestsRootDir, testFolderName)
  await mkdir(requestsDir, { recursive: true })
  await writeFile(
    join(requestsDir, `${timestamp}_https_example_com_api_data.json`),
    JSON.stringify({
      metadata: {
        responseType: 'text',
        timestamp,
      },
      request: {
        headers: {},
        method: 'GET',
        url: 'https://example.com/api/data',
      },
      response: {
        body,
        headers: { 'content-type': 'text/plain' },
        statusCode: 200,
        statusMessage: 'OK',
      },
    }),
    'utf8',
  )
}

afterEach(async () => {
  await rm(join(requestsRootDir, firstTestFolderName), { force: true, recursive: true })
  await rm(join(requestsRootDir, secondTestFolderName), { force: true, recursive: true })
  await rm(join(requestsRootDir, expiredTokenTestFolderName), { force: true, recursive: true })
  await rm(join(requestsRootDir, pathPlaceholderTestFolderName), { force: true, recursive: true })
  await rm(join(requestsRootDir, tokenTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, firstTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, secondTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, expiredTokenTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, pathPlaceholderTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, tokenTestFolderName), { force: true, recursive: true })
})

test('convertRequestsToMocksMain - converts each test folder independently', async () => {
  await writeRecordedRequest(firstTestFolderName, 'body-a', 1)
  await writeRecordedRequest(secondTestFolderName, 'body-b', 2)

  await ConvertRequestsToMocks.convertRequestsToMocksMain()

  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  const firstMockContent = await readFile(join(mocksRootDir, firstTestFolderName, mockFileName), 'utf8')
  const secondMockContent = await readFile(join(mocksRootDir, secondTestFolderName, mockFileName), 'utf8')

  expect(JSON.parse(firstMockContent)).toEqual({
    metadata: {
      responseType: 'text',
      timestamp: 1,
    },
    request: {
      method: 'GET',
      url: 'https://example.com/api/data',
    },
    response: {
      body: 'body-a',
      headers: { 'content-type': 'text/plain' },
      statusCode: 200,
      statusMessage: 'OK',
    },
  })
  expect(JSON.parse(secondMockContent)).toEqual({
    metadata: {
      responseType: 'text',
      timestamp: 2,
    },
    request: {
      method: 'GET',
      url: 'https://example.com/api/data',
    },
    response: {
      body: 'body-b',
      headers: { 'content-type': 'text/plain' },
      statusCode: 200,
      statusMessage: 'OK',
    },
  })
})

test('convertRequestsToMocksMain - keeps GET and OPTIONS token mocks separate', async () => {
  const requestsDir = join(requestsRootDir, tokenTestFolderName)
  await mkdir(requestsDir, { recursive: true })

  await writeFile(
    join(requestsDir, '1_https___api_github_com_copilot_internal_v2_token.json'),
    JSON.stringify({
      metadata: {
        responseType: 'json',
        timestamp: 1,
      },
      request: {
        headers: {},
        method: 'GET',
        url: 'https://api.github.com/copilot_internal/v2/token',
      },
      response: {
        body: {
          token: 'tid=abc;exp=1700000100;iat=1700000000',
        },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
        statusMessage: 'OK',
      },
    }),
    'utf8',
  )

  await writeFile(
    join(requestsDir, '2_https___api_github_com_copilot_internal_v2_token.json'),
    JSON.stringify({
      metadata: {
        responseType: 'text',
        timestamp: 2,
      },
      request: {
        headers: {},
        method: 'OPTIONS',
        url: 'https://api.github.com/copilot_internal/v2/token',
      },
      response: {
        body: '',
        headers: {},
        statusCode: 204,
        statusMessage: 'No Content',
      },
    }),
    'utf8',
  )

  await ConvertRequestsToMocks.convertRequestsToMocksMain()

  const getMockFileName = await GetMockFileName.getMockFileName('api.github.com', '/copilot_internal/v2/token', 'GET')
  const optionsMockFileName = await GetMockFileName.getMockFileName('api.github.com', '/copilot_internal/v2/token', 'OPTIONS')

  const getMockContent = await readFile(join(mocksRootDir, tokenTestFolderName, getMockFileName), 'utf8')
  const optionsMockContent = await readFile(join(mocksRootDir, tokenTestFolderName, optionsMockFileName), 'utf8')

  expect(JSON.parse(getMockContent)).toEqual({
    metadata: {
      responseType: 'json',
      timestamp: 1,
    },
    request: {
      body: undefined,
      method: 'GET',
      url: 'https://api.github.com/copilot_internal/v2/token',
    },
    response: {
      body: {
        token: 'tid=00000000-0000-4000-8000-000000000001;exp=4102444800;iat=1700000000',
      },
      headers: { 'content-type': 'application/json' },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })

  expect(JSON.parse(optionsMockContent)).toEqual({
    metadata: {
      responseType: 'text',
      timestamp: 2,
    },
    request: {
      body: undefined,
      method: 'OPTIONS',
      url: 'https://api.github.com/copilot_internal/v2/token',
    },
    response: {
      body: '',
      headers: {},
      statusCode: 204,
      statusMessage: 'No Content',
      wasCompressed: undefined,
    },
  })
})

test('convertRequestsToMocksMain - sanitizes signed nltoken payloads and telemetry ids', async () => {
  const requestsDir = join(requestsRootDir, tokenTestFolderName)
  await mkdir(requestsDir, { recursive: true })

  await writeFile(
    join(requestsDir, '1_https___api_github_com_copilot_internal_v2_nltoken.json'),
    JSON.stringify({
      metadata: {
        responseType: 'json',
        timestamp: 1,
      },
      request: {
        headers: {},
        method: 'GET',
        url: 'https://api.github.com/copilot_internal/v2/nltoken',
      },
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
    }),
    'utf8',
  )

  await ConvertRequestsToMocks.convertRequestsToMocksMain()

  const mockFileName = await GetMockFileName.getMockFileName('api.github.com', '/copilot_internal/v2/nltoken', 'GET')
  const mockContent = await readFile(join(mocksRootDir, tokenTestFolderName, mockFileName), 'utf8')
  const parsed = JSON.parse(mockContent)

  expect(parsed.response.body).toEqual({
    expires_at: 4_102_444_800,
    iat: 1_700_000_000,
    token:
      'tid=00000000-0000-4000-8000-000000000001;exp=4102444800;sku=no_auth_limited_copilot;proxy-ep=proxy.individual.githubcopilot.com;st=dotcom;chat=1;malfil=1;agent_mode=1;mcp=1;ip=203.0.113.10;asn=AS65500:mock',
    tracking_id: '00000000-0000-4000-8000-000000000001',
  })
  expect(parsed.response.headers).toEqual({
    activityid: '00000000-0000-4000-8000-000000000010',
    'content-type': 'application/json',
    'request-context': 'appId=cid-v1:00000000-0000-4000-8000-000000000014',
    'x-tfs-session': '00000000-0000-4000-8000-000000000011',
    'x-vss-e2eid': '00000000-0000-4000-8000-000000000012',
  })
})

test('convertRequestsToMocksMain - replaces absolute root and workspace paths with placeholders', async () => {
  const requestsDir = join(requestsRootDir, pathPlaceholderTestFolderName)
  const workspaceFilePath = join(Root.root, '.vscode-test-workspace', 'test', 'add.test.js')
  const sseFilePath = join(Root.root, '.vscode-sse-data', pathPlaceholderTestFolderName, 'fixture.txt')
  await mkdir(requestsDir, { recursive: true })

  await writeFile(
    join(requestsDir, '1_https___example_com_api_data.json'),
    JSON.stringify({
      metadata: {
        responseType: 'sse',
        timestamp: 1,
      },
      request: {
        body: {
          filePath: workspaceFilePath,
        },
        headers: {},
        method: 'POST',
        url: 'https://example.com/api/data',
      },
      response: {
        body: `file-reference:${sseFilePath}`,
        headers: { 'content-type': 'text/event-stream' },
        statusCode: 200,
        statusMessage: 'OK',
      },
    }),
    'utf8',
  )

  await ConvertRequestsToMocks.convertRequestsToMocksMain()

  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'POST', {
    filePath: workspaceFilePath,
  })
  const mockContent = await readFile(join(mocksRootDir, pathPlaceholderTestFolderName, mockFileName), 'utf8')

  expect(JSON.parse(mockContent)).toEqual({
    metadata: {
      responseType: 'sse',
      timestamp: 1,
    },
    request: {
      body: {
        filePath: '@@WORKSPACE_PATH@@/test/add.test.js',
      },
      method: 'POST',
      url: 'https://example.com/api/data',
    },
    response: {
      body: `file-reference:@@ROOT_PATH@@/.vscode-sse-data/${pathPlaceholderTestFolderName}/fixture.txt`,
      headers: { 'content-type': 'text/event-stream' },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })
})

test('convertRequestsToMocksMain - prefers a successful response over a later expired-token 401', async () => {
  const requestBody = {
    messages: [
      {
        content: 'fix the failing test',
        role: 'user',
      },
    ],
  }
  const requestsDir = join(requestsRootDir, expiredTokenTestFolderName)
  await mkdir(requestsDir, { recursive: true })

  await writeFile(
    join(requestsDir, '1_https___api_individual_githubcopilot_com_chat_completions.json'),
    JSON.stringify({
      metadata: {
        responseType: 'text',
        timestamp: 1,
      },
      request: {
        body: requestBody,
        headers: {},
        method: 'POST',
        url: 'https://api.individual.githubcopilot.com/chat/completions',
      },
      response: {
        body: 'ok',
        headers: { 'content-type': 'text/plain' },
        statusCode: 200,
        statusMessage: 'OK',
      },
    }),
    'utf8',
  )

  await writeFile(
    join(requestsDir, '2_https___api_individual_githubcopilot_com_chat_completions.json'),
    JSON.stringify({
      metadata: {
        responseType: 'text',
        timestamp: 2,
      },
      request: {
        body: requestBody,
        headers: {},
        method: 'POST',
        url: 'https://api.individual.githubcopilot.com/chat/completions',
      },
      response: {
        body: 'IDE token expired: unauthorized: token expired\n',
        headers: { 'content-type': 'text/plain' },
        statusCode: 401,
        statusMessage: 'Unauthorized',
      },
    }),
    'utf8',
  )

  await ConvertRequestsToMocks.convertRequestsToMocksMain()

  const mockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/chat/completions', 'POST', requestBody)
  const mockContent = await readFile(join(mocksRootDir, expiredTokenTestFolderName, mockFileName), 'utf8')

  expect(JSON.parse(mockContent)).toEqual({
    metadata: {
      responseType: 'text',
      timestamp: 1,
    },
    request: {
      body: requestBody,
      method: 'POST',
      url: 'https://api.individual.githubcopilot.com/chat/completions',
    },
    response: {
      body: 'ok',
      headers: { 'content-type': 'text/plain' },
      statusCode: 200,
      statusMessage: 'OK',
      wasCompressed: undefined,
    },
  })
})
