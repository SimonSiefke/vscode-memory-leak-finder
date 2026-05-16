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

  const fileName = await GetMockFileName.getMockFileName(
    'api.individual.githubcopilot.com',
    '/chat/completions',
    'POST',
    requestBody,
  )

  expect(fileName).toMatch(/^api_individual_githubcopilot_com_chat_completions_post_[a-f0-9]{16}\.json$/)
})