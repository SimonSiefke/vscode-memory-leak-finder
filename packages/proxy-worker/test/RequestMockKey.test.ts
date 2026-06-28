import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import * as GetMockFileName from '../src/parts/GetMockFileName/GetMockFileName.ts'
import * as RequestMockKey from '../src/parts/RequestMockKey/RequestMockKey.ts'
import * as Root from '../src/parts/Root/Root.ts'

test('getRequestMockKey returns different keys for different Copilot user requests', () => {
  const firstRequest = {
    messages: [
      {
        content: 'system prompt',
        role: 'system',
      },
      {
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        content: 'system prompt',
        role: 'system',
      },
      {
        content: '<userRequest>Generate a title</userRequest>',
        role: 'user',
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
        content: 'system prompt one',
        role: 'system',
      },
      {
        content: '<context>The current date is May 16, 2026.</context><userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        content: 'system prompt two',
        role: 'system',
      },
      {
        content: '<context>The current date is May 17, 2026.</context><userRequest>Fix the failing test</userRequest>',
        role: 'user',
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
        content:
          '<userRequest>Fix the failing test</userRequest> Reading /tmp/call_AbC123XyZ__vscode-1778940406769/content.txt and proxy http://localhost:39107',
        role: 'user',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        content:
          '<userRequest>Fix the failing test</userRequest> Reading /tmp/call_Qwe987Rty__vscode-1778940336321/content.txt and proxy http://localhost:34941',
        role: 'user',
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
        content: `<userRequest>Fix the failing test</userRequest> Read ${workspacePath}`,
        role: 'user',
      },
    ],
  }
  const requestWithPlaceholderPath = {
    messages: [
      {
        content: '<userRequest>Fix the failing test</userRequest> Read @@WORKSPACE_PATH@@/test/add.test.js',
        role: 'user',
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
        content:
          'Arguments (JSON): {"command":"node --test","explanation":"Run Node.js tests using the built-in test runner to identify any failing tests.","goal":"Run all tests and identify failures in the project","mode":"sync"}',
        role: 'user',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        content:
          'Arguments (JSON): {"command":"node --test","explanation":"Run Node.js tests using the built-in test runner to identify any failing tests.","goal":"Run all tests and identify failures in the test suite.","mode":"sync","timeout":120000}',
        role: 'user',
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
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
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
        content: '✖ add returns the sum of two numbers (2.098225ms)\nℹ duration_ms 127.696059\nTime:        23.468 s',
        role: 'tool',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
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
        content: '✖ add returns the sum of two numbers (1.878015ms)\nℹ duration_ms 105.086936\nTime:        18.102 s',
        role: 'tool',
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
        content: 'system prompt',
        role: 'system',
      },
      {
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
    ],
  }
  const secondTurn = {
    messages: [
      {
        content: 'system prompt',
        role: 'system',
      },
      {
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
      {
        content: 'I will update the test file.',
        role: 'assistant',
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
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
    ],
  }
  const secondRequest = {
    messages: [
      {
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
      {
        content: 'I can help with that.',
        role: 'assistant',
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
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
      {
        content: 'I will inspect the file.',
        role: 'assistant',
      },
    ],
  }
  const toolContextRequest = {
    messages: [
      {
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
      },
      {
        content: 'I will inspect the file.',
        role: 'assistant',
      },
      {
        content: 'read_file output',
        role: 'tool',
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
        content: '<userRequest>Fix the failing test</userRequest>',
        role: 'user',
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
        content: [{ text: '<userRequest>Fix the failing test</userRequest>', type: 'input_text' }],
        role: 'user',
      },
      {
        encrypted_content: 'opaque-first',
        id: 'rs_123',
        summary: ['first summary'],
        type: 'reasoning',
      },
      {
        arguments: '{"command":"node --test","goal":"Run tests"}',
        call_id: 'call_FirstToolCall123',
        name: 'run_in_terminal',
        type: 'function_call',
      },
      {
        call_id: 'call_FirstToolCall123',
        output: 'tests finished',
        type: 'function_call_output',
      },
    ],
  }

  const secondRequest = {
    input: [
      {
        content: [{ text: '<userRequest>Fix the failing test</userRequest>', type: 'input_text' }],
        role: 'user',
      },
      {
        encrypted_content: 'opaque-second',
        id: 'rs_456',
        summary: ['second summary'],
        type: 'reasoning',
      },
      {
        arguments: '{"command":"node --test","goal":"Run tests"}',
        call_id: 'call_SecondToolCall456',
        name: 'run_in_terminal',
        type: 'function_call',
      },
      {
        call_id: 'call_SecondToolCall456',
        output: 'tests finished',
        type: 'function_call_output',
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
        content: [{ text: 'system prompt version one', type: 'input_text' }],
        role: 'system',
      },
      {
        content: [{ text: '<userRequest>Fix the failing test</userRequest>', type: 'input_text' }],
        role: 'user',
      },
      {
        id: 'rs_first',
        type: 'reasoning',
      },
      {
        content: [{ text: 'Running the test suite with `node --test` to see failing output.', type: 'output_text' }],
        role: 'assistant',
      },
      {
        arguments: '{"command":"node --test","goal":"Run tests"}',
        call_id: 'call_First',
        name: 'run_in_terminal',
        type: 'function_call',
      },
      {
        call_id: 'call_First',
        output:
          '✖ add returns the sum of two numbers (2.484359ms)\nℹ tests 1\nℹ duration_ms 107.286992\nTime:        20.368 s\nsimon (main) .vscode-test-workspace $',
        type: 'function_call_output',
      },
    ],
  }

  const secondRequest = {
    input: [
      {
        content: [{ text: 'system prompt version two', type: 'input_text' }],
        role: 'system',
      },
      {
        content: [{ text: '<userRequest>Fix the failing test</userRequest>', type: 'input_text' }],
        role: 'user',
      },
      {
        id: 'rs_second',
        type: 'reasoning',
      },
      {
        content: [{ text: 'Running the test suite with `node --test` to see failing output.', type: 'output_text' }],
        role: 'assistant',
      },
      {
        arguments: '{"command":"node --test","goal":"Run tests"}',
        call_id: 'call_Second',
        name: 'run_in_terminal',
        type: 'function_call',
      },
      {
        call_id: 'call_Second',
        output:
          '✖ add returns the sum of two numbers (1.670809ms)\nℹ tests 1\nℹ duration_ms 105.086936\nTime:        18.102 s\nsimon (main *) .vscode-test-workspace $',
        type: 'function_call_output',
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
        content: [{ text: 'system prompt version one', type: 'input_text' }],
        role: 'system',
      },
      {
        content: [{ text: '<userRequest>Run the tests with node --test and fix the failing test.</userRequest>', type: 'input_text' }],
        role: 'user',
      },
      {
        content: [{ text: 'Running node --test.', type: 'output_text' }],
        role: 'assistant',
      },
      {
        arguments: '{"command":"node --test","goal":"Run tests"}',
        call_id: 'call_First',
        name: 'run_in_terminal',
        type: 'function_call',
      },
      {
        call_id: 'call_First',
        output: 'tests failed',
        type: 'function_call_output',
      },
    ],
  }

  const secondRequest = {
    input: [
      {
        content: [{ text: 'system prompt version two', type: 'input_text' }],
        role: 'system',
      },
      {
        content: [{ text: '<userRequest>Run the tests with node --test and fix the failing test.</userRequest>', type: 'input_text' }],
        role: 'user',
      },
      {
        content: [{ text: 'Running node --test.', type: 'output_text' }],
        role: 'assistant',
      },
      {
        arguments: '{"command":"node --test","goal":"Run tests"}',
        call_id: 'call_First',
        name: 'run_in_terminal',
        type: 'function_call',
      },
      {
        call_id: 'call_First',
        output: 'tests failed',
        type: 'function_call_output',
      },
      {
        content: [{ text: 'Now I will inspect the test file.', type: 'output_text' }],
        role: 'assistant',
      },
      {
        arguments: '{"filePath":"/workspace/test/add.test.js"}',
        call_id: 'call_Second',
        name: 'read_file',
        type: 'function_call',
      },
      {
        call_id: 'call_Second',
        output: 'assert.equal(add(1, 2), 4)',
        type: 'function_call_output',
      },
    ],
  }

  const firstKey = RequestMockKey.getUserRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', firstRequest)
  const secondKey = RequestMockKey.getUserRequestMockKey('api.individual.githubcopilot.com', '/responses', 'POST', secondRequest)

  expect(firstKey).toBeDefined()
  expect(secondKey).toBeDefined()
  expect(firstKey).toBe(secondKey)
})
