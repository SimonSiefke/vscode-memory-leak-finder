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
  await rm(join(mocksRootDir, firstTestFolderName), { force: true, recursive: true })
  await rm(join(mocksRootDir, secondTestFolderName), { force: true, recursive: true })
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
