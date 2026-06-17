import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import * as GetMockFileName from '../src/parts/GetMockFileName/GetMockFileName.ts'
import * as RequestMockKey from '../src/parts/RequestMockKey/RequestMockKey.ts'
import * as Root from '../src/parts/Root/Root.ts'

test('getRequestMockKey returns different keys for different Copilot user requests', () => {
  const firstRequest = {
    messages: [
      {
        role: 'system',
        content: 'system prompt',
      },
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        role: 'system',
        content: 'system prompt',
      },
      {
        role: 'user',
        content: '<userRequest>Generate a title</userRequest>',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).not.toBe(secondKey)
})

test('getRequestMockKey ignores system prompts and date-like context noise', () => {
  const firstRequest = {
    messages: [
      {
        role: 'system',
        content: 'system prompt one',
      },
      {
        role: 'user',
        content: '<context>The current date is May 16, 2026.</context><userRequest>Fix the failing test</userRequest>',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        role: 'system',
        content: 'system prompt two',
      },
      {
        role: 'user',
        content: '<context>The current date is May 17, 2026.</context><userRequest>Fix the failing test</userRequest>',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondRequest)

  expect(firstKey).toBe(secondKey)
})

test('getRequestMockKey normalizes dynamic session call IDs and localhost ports', () => {
  const firstRequest = {
    messages: [
      {
        role: 'user',
        content:
          '<userRequest>Fix the failing test</userRequest> Reading /tmp/call_AbC123XyZ__vscode-1778940406769/content.txt and proxy http://localhost:39107',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        role: 'user',
        content:
          '<userRequest>Fix the failing test</userRequest> Reading /tmp/call_Qwe987Rty__vscode-1778940336321/content.txt and proxy http://localhost:34941',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})

test('getRequestMockKey treats placeholderized workspace paths as the active workspace path', () => {
  const workspacePath = join(Root.root, '.vscode-test-workspace', 'test', 'add.test.js')
  const requestWithAbsolutePath = {
    messages: [
      {
        role: 'user',
        content: `<userRequest>Fix the failing test</userRequest> Read ${workspacePath}`,
      },
    ],
  }
  const requestWithPlaceholderPath = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest> Read @@WORKSPACE_PATH@@/test/add.test.js',
      },
    ],
  }

  const absoluteKey = RequestMockKey.getRequestMockKey(
    'api.individual.githubcopilot.com',
    '/chat/completions',
    'POST',
    requestWithAbsolutePath,
  )
  const placeholderKey = RequestMockKey.getRequestMockKey(
    'api.individual.githubcopilot.com',
    '/chat/completions',
    'POST',
    requestWithPlaceholderPath,
  )

  expect(absoluteKey).toBeDefined()
  expect(placeholderKey).toBeDefined()
  expect(absoluteKey).toBe(placeholderKey)
})

test('getRequestMockKey normalizes embedded tool metadata in prompt text', () => {
  const firstRequest = {
    messages: [
      {
        role: 'user',
        content:
          'Arguments (JSON): {"command":"node --test","explanation":"Run Node.js tests using the built-in test runner to identify any failing tests.","goal":"Run all tests and identify failures in the project","mode":"sync"}',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        role: 'user',
        content:
          'Arguments (JSON): {"command":"node --test","explanation":"Run Node.js tests using the built-in test runner to identify any failing tests.","goal":"Run all tests and identify failures in the test suite.","mode":"sync","timeout":120000}',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})

test('getRequestMockKey normalizes tool call metadata and timing-only tool output noise', () => {
  const firstRequest = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
      {
        role: 'assistant',
        tool_calls: [
          {
            function: {
              arguments:
                '{"command":"node --test","explanation":"Run tests","goal":"Run all tests and identify failures in the project","mode":"sync"}',
              name: 'run_in_terminal',
            },
            type: 'function',
          },
        ],
      },
      {
        role: 'tool',
        content: '✖ add returns the sum of two numbers (2.098225ms)\nℹ duration_ms 127.696059\nTime:        23.468 s',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
      {
        role: 'assistant',
        tool_calls: [
          {
            function: {
              arguments:
                '{"command":"node --test","explanation":"Run tests","goal":"Run all tests and identify failures in the test suite.","mode":"sync","timeout":120000}',
              name: 'run_in_terminal',
            },
            type: 'function',
          },
        ],
      },
      {
        role: 'tool',
        content: '✖ add returns the sum of two numbers (1.878015ms)\nℹ duration_ms 105.086936\nTime:        18.102 s',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})

test('getRequestMockKey differentiates later turns in the same Copilot conversation', () => {
  const firstTurn = {
    messages: [
      {
        role: 'system',
        content: 'system prompt',
      },
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
    ],
  }
  const secondTurn = {
    messages: [
      {
        role: 'system',
        content: 'system prompt',
      },
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
      {
        role: 'assistant',
        content: 'I will update the test file.',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstTurn)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondTurn)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).not.toBe(secondKey)
})

test('getRelaxedRequestMockKey differentiates requests with different message counts', () => {
  const firstRequest = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
      {
        role: 'assistant',
        content: 'I can help with that.',
      },
    ],
  }

  const firstKey = RequestMockKey.getRelaxedRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRelaxedRequestMockKey('api.individual.githubcopilot.com', '/chat/completions', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).not.toBe(secondKey)
})

test('getRelaxedRequestMockKey differentiates tool-context turns', () => {
  const noToolContextRequest = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
      {
        role: 'assistant',
        content: 'I will inspect the file.',
      },
    ],
  }
  const toolContextRequest = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
      {
        role: 'assistant',
        content: 'I will inspect the file.',
      },
      {
        role: 'tool',
        content: 'read_file output',
        tool_call_id: 'tool-call-1',
      },
    ],
  }

  const noToolContextKey = RequestMockKey.getRelaxedRequestMockKey(
    'api.individual.githubcopilot.com',
    '/chat/completions',
    'POST',
    noToolContextRequest,
  )
  const toolContextKey = RequestMockKey.getRelaxedRequestMockKey(
    'api.individual.githubcopilot.com',
    '/chat/completions',
    'POST',
    toolContextRequest,
  )

  expect(noToolContextKey).toBeDefined()
  expect(toolContextKey).toBeDefined()
  expect(noToolContextKey).not.toBe(toolContextKey)
})

test('getMockFileName adds Copilot request key suffix', async () => {
  const requestBody = {
    messages: [
      {
        role: 'user',
        content: '<userRequest>Fix the failing test</userRequest>',
      },
    ],
  }

  const fileName = await GetMockFileName.getMockFileName('api.individual.githubcopilot.com', '/chat/completions', 'POST', requestBody)

  expect(fileName).toMatch(/^api_individual_githubcopilot_com_chat_completions_post_[a-f0-9]{16}\.json$/)
})

test('getMockFileName separates GET and OPTIONS token mocks', async () => {
  const getFileName = await GetMockFileName.getMockFileName('api.github.com', '/copilot_internal/v2/token', 'GET')
  const optionsFileName = await GetMockFileName.getMockFileName('api.github.com', '/copilot_internal/v2/token', 'OPTIONS')

  expect(getFileName).toBe('api_github_com_copilot_internal_v2_token_get.json')
  expect(optionsFileName).toBe('api_github_com_copilot_internal_v2_token_options.json')
})

test('getRequestMockKey ignores dynamic call ids and encrypted reasoning content for responses requests', () => {
  const firstRequest = {
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        type: 'reasoning',
        id: 'rs_123',
        summary: ['first summary'],
        encrypted_content: 'opaque-first',
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_FirstToolCall123',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_FirstToolCall123',
        output: 'tests finished',
      },
    ],
  }

  const secondRequest = {
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: '<userRequest>Fix the failing test</userRequest>' }],
      },
      {
        type: 'reasoning',
        id: 'rs_456',
        summary: ['second summary'],
        encrypted_content: 'opaque-second',
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_SecondToolCall456',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_SecondToolCall456',
        output: 'tests finished',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})

test('getRequestMockKey ignores responses system prompt churn and timing-only tool output noise', () => {
  const firstRequest = {
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
        id: 'rs_first',
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Running the test suite with `node --test` to see failing output.' }],
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
        output:
          '✖ add returns the sum of two numbers (2.484359ms)\nℹ tests 1\nℹ duration_ms 107.286992\nTime:        20.368 s\nsimon (main) .vscode-test-workspace $',
      },
    ],
  }

  const secondRequest = {
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
        id: 'rs_second',
      },
      {
        role: 'assistant',
        content: [{ type: 'output_text', text: 'Running the test suite with `node --test` to see failing output.' }],
      },
      {
        type: 'function_call',
        name: 'run_in_terminal',
        call_id: 'call_Second',
        arguments: '{"command":"node --test","goal":"Run tests"}',
      },
      {
        type: 'function_call_output',
        call_id: 'call_Second',
        output:
          '✖ add returns the sum of two numbers (1.670809ms)\nℹ tests 1\nℹ duration_ms 105.086936\nTime:        18.102 s\nsimon (main *) .vscode-test-workspace $',
      },
    ],
  }

  const firstKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', firstRequest)
  const secondKey = RequestMockKey.getRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})

test('getUserRequestMockKey matches later responses turns for the same user request', () => {
  const firstRequest = {
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: 'system prompt version one' }],
      },
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

  const secondRequest = {
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: 'system prompt version two' }],
      },
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

  const firstKey = RequestMockKey.getUserRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', firstRequest)
  const secondKey = RequestMockKey.getUserRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})
