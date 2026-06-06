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
  await rm(join(Root.root, '.vscode-sse-data', testFolderName), { force: true, recursive: true })
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

test('getMockResponse - restores placeholderized workspace paths in json responses', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      metadata: { responseType: 'json' },
      response: {
        body: {
          filePath: '@@WORKSPACE_PATH@@/test/add.test.js',
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
      filePath: join(Root.root, '.vscode-test-workspace', 'test', 'add.test.js'),
    }),
    headers: { 'content-type': 'application/json' },
    statusCode: 200,
  })
})

test('getMockResponse - restores placeholderized file references and SSE payloads', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })
  const sseDir = join(Root.root, '.vscode-sse-data', testFolderName)
  await mkdir(sseDir, { recursive: true })
  await writeFile(join(sseDir, 'fixture.txt'), 'data: @@WORKSPACE_PATH@@/test/add.test.js\n\n', 'utf8')
  const mockFileName = await GetMockFileName.getMockFileName('example.com', '/api/data', 'GET')
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      metadata: { responseType: 'sse' },
      response: {
        body: `file-reference:@@ROOT_PATH@@/.vscode-sse-data/${testFolderName}/fixture.txt`,
        headers: { 'content-type': 'text/event-stream', 'content-encoding': 'gzip' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('GET', 'https://example.com/api/data')

  expect(result).toEqual({
    body: Buffer.from(`data: ${join(Root.root, '.vscode-test-workspace', 'test', 'add.test.js')}\n\n`, 'utf8'),
    headers: { 'content-type': 'text/event-stream' },
    statusCode: 200,
  })
})

test('getMockResponse - prefers the closest /responses user-request fallback match', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })

  const oldRequestBody = {
    model: 'gpt-5-mini',
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Running tests and inspecting files.' }],
      },
      { type: 'function_call_output', call_id: 'call_old_1', output: 'failing test output with expected 4' },
      { type: 'function_call_output', call_id: 'call_old_2', output: 'No memories found.' },
      { type: 'function_call_output', call_id: 'call_old_3', output: 'ERROR while calling tool: Invalid input path: src/add.js' },
      { type: 'function_call_output', call_id: 'call_old_4', output: 'export const add = (a, b) => a + b' },
      {
        type: 'function_call_output',
        call_id: 'call_old_5',
        output: "import assert from 'node:assert/strict'\nassert.equal(add(1, 2), 4)",
      },
    ],
  }

  const closeRequestBody = {
    model: 'gpt-5.3-codex',
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'I found the bad assertion and will patch it.' }],
      },
      { type: 'function_call_output', call_id: 'call_new_1', output: 'failing test output with expected 4 and actual 3' },
      { type: 'function_call_output', call_id: 'call_new_2', output: 'No memories found.' },
    ],
  }

  const currentRequestBody = {
    model: 'gpt-5.4',
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'I found the bad assertion and will patch it.' }],
      },
      { type: 'function_call_output', call_id: 'call_current_1', output: 'failing test output with expected 4 and actual 5' },
      { type: 'function_call_output', call_id: 'call_current_2', output: 'No memories found.' },
    ],
  }

  const oldMockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/responses', 'POST', oldRequestBody)
  await writeFile(
    join(scopedMockDir, oldMockFileName),
    JSON.stringify({
      response: { body: 'old-candidate', headers: { 'content-type': 'text/plain' }, statusCode: 200 },
      request: { body: oldRequestBody },
    }),
    'utf8',
  )

  const closeMockFileName = await GetMockFileName.getMockFileName(
    'api.individual.githubcopilot.com',
    '/responses',
    'POST',
    closeRequestBody,
  )
  await writeFile(
    join(scopedMockDir, closeMockFileName),
    JSON.stringify({
      response: { body: 'close-candidate', headers: { 'content-type': 'text/plain' }, statusCode: 200 },
      request: { body: closeRequestBody },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('POST', 'https://api.individual.githubcopilot.com/responses', currentRequestBody)

  expect(result).toEqual({
    body: 'close-candidate',
    headers: { 'content-type': 'text/plain' },
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

test('getMockResponse - matches responses mocks despite dynamic call ids and encrypted reasoning content', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })

  const recordedRequestBody = {
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        type: 'reasoning',
        id: 'rs_recorded',
        summary: ['recorded'],
        encrypted_content: 'opaque-recorded',
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_Recorded123',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_Recorded123',
        output: 'tests finished',
      },
    ],
  }

  const replayedRequestBody = {
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        type: 'reasoning',
        id: 'rs_replayed',
        summary: ['replayed'],
        encrypted_content: 'opaque-replayed',
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_Replayed456',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_Replayed456',
        output: 'tests finished',
      },
    ],
  }

  const mockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/responses', 'POST', recordedRequestBody)
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      response: {
        body: 'mocked-response',
        headers: { 'content-type': 'text/plain' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('POST', 'https://api.individual.githubcopilot.com/responses', replayedRequestBody)

  expect(result).toEqual({
    body: 'mocked-response',
    headers: { 'content-type': 'text/plain' },
    statusCode: 200,
  })
})

test('getMockResponse - matches responses mocks despite system prompt churn and timing-only tool output noise', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })

  const recordedRequestBody = {
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: 'system prompt version one' }],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        type: 'reasoning',
        id: 'rs_recorded',
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Running the test suite with `node --test` to see failing output.' }],
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_Recorded123',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_Recorded123',
        output:
          '✖ add returns the sum of two numbers (2.484359ms)\nℹ tests 1\nℹ duration_ms 107.286992\nTime:        20.368 s\nsimon (main) .vscode-test-workspace $',
      },
    ],
  }

  const replayedRequestBody = {
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: 'system prompt version two' }],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        type: 'reasoning',
        id: 'rs_replayed',
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Running the test suite with `node --test` to see failing output.' }],
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_Replayed456',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_Replayed456',
        output:
          '✖ add returns the sum of two numbers (1.670809ms)\nℹ tests 1\nℹ duration_ms 105.086936\nTime:        18.102 s\nsimon (main *) .vscode-test-workspace $',
      },
    ],
  }

  const mockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/responses', 'POST', recordedRequestBody)
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      response: {
        body: 'mocked-response',
        headers: { 'content-type': 'text/plain' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('POST', 'https://api.individual.githubcopilot.com/responses', replayedRequestBody)

  expect(result).toEqual({
    body: 'mocked-response',
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

test('getMockResponse - skips poisoned responses mocks with bad request auth errors so replay can fall through', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })

  const requestBody = {
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
    ],
  }

  const mockFileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/responses', 'POST', requestBody)
  await writeFile(
    join(scopedMockDir, mockFileName),
    JSON.stringify({
      response: {
        body: 'IDE authentication failed: bad request: invalid token: cannot decode HMAC\n',
        headers: { 'content-type': 'text/plain' },
        statusCode: 400,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('POST', 'https://api.individual.githubcopilot.com/responses', requestBody)

  expect(result).toBeNull()
})

test('getMockResponse - falls back to a later healthy responses mock for the same user request', async () => {
  ProxyState.setTestFolderName(testFolderName)
  await mkdir(scopedMockDir, { recursive: true })

  const earlyRequestBody = {
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Run the tests with node --test and fix the failing test.</userRequest>' }],
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Running node --test.' }],
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_First',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_First',
        output: 'tests failed',
      },
    ],
  }

  const laterRequestBody = {
    input: [
      ...earlyRequestBody.input,
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Now I will inspect the test file.' }],
      },
      {
        type: 'function_call',
        name: 'read_file',
        call_id: 'call_Second',
        arguments: '{"filePath":"/workspace/test/add.test.js"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_Second',
        output: 'assert.equal(add(1, 2), 4)',
      },
    ],
  }

  const poisonedMockFileName = await GetMockFileName.getMockFileName(
    'api.individual.githubcopilot.com',
    '/responses',
    'POST',
    earlyRequestBody,
  )
  const healthyMockFileName = await GetMockFileName.getMockFileName(
    'api.individual.githubcopilot.com',
    '/responses',
    'POST',
    laterRequestBody,
  )

  await writeFile(
    join(scopedMockDir, poisonedMockFileName),
    JSON.stringify({
      request: { body: earlyRequestBody },
      response: {
        body: 'IDE authentication failed: bad request: invalid token: cannot decode HMAC\n',
        headers: { 'content-type': 'text/plain' },
        statusCode: 400,
      },
    }),
    'utf8',
  )

  await writeFile(
    join(scopedMockDir, healthyMockFileName),
    JSON.stringify({
      request: { body: laterRequestBody },
      response: {
        body: 'healthy-response',
        headers: { 'content-type': 'text/plain' },
        statusCode: 200,
      },
    }),
    'utf8',
  )

  const result = await GetMockResponse.getMockResponse('POST', 'https://api.individual.githubcopilot.com/responses', earlyRequestBody)

  expect(result).toEqual({
    body: 'healthy-response',
    headers: { 'content-type': 'text/plain' },
    statusCode: 200,
  })
})
