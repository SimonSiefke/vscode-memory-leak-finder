import { expect, test } from '@jest/globals'
import * as GetMockFileName from '../src/parts/GetMockFileName/GetMockFileName.ts'
import * as RequestMockKey from '../src/parts/RequestMockKey/RequestMockKey.ts'

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
