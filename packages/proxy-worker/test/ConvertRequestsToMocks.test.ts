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
  await rm(join(requestsRootDir, tokenTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, firstTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, secondTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, expiredTokenTestFolderName), { force: true, recursive: true })
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
        token: expect.stringContaining('tid=abc;exp='),
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

test('convertRequestsToMocksMain - prefers a successful response over a later expired-token 401', async () => {
  const requestBody = {
    messages: [
      {
        role: 'user',
        content: 'fix the failing test',
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
