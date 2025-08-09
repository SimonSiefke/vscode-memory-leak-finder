import { expect, test, jest } from '@jest/globals'
import * as ScenarioFunctions from '../src/parts/ScenarioFunctions/ScenarioFunctions.ts'
import * as SessionState from '../src/parts/SessionState/SessionState.ts'
import * as TargetState from '../src/parts/TargetState/TargetState.ts'
import * as DevtoolsTargetType from '../src/parts/DevtoolsTargetType/DevtoolsTargetType.ts'

test('handleAttachedToTarget function exists', () => {
  expect(typeof ScenarioFunctions.handleAttachedToTarget).toBe('function')
})

test('handleDetachedFromTarget function exists', () => {
  expect(typeof ScenarioFunctions.handleDetachedFromTarget).toBe('function')
})

test('handleAttachedToTarget handles browser type', () => {
  // Mock console methods to suppress output during test
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  const mockMessage = {
    params: {
      targetInfo: {
        type: DevtoolsTargetType.Browser,
        targetId: 'browser-123',
        url: 'about:blank'
      }
    }
  }

  // Should not throw for browser type
  expect(() => ScenarioFunctions.handleAttachedToTarget(mockMessage)).not.toThrow()

  // Restore console method
  consoleLogSpy.mockRestore()
})

test('handleAttachedToTarget handles unknown type', () => {
  const mockMessage = {
    params: {
      targetInfo: {
        type: 'unknown-type',
        targetId: 'unknown-123',
        url: 'about:blank'
      }
    }
  }

  // Should not throw for unknown type (falls through default case)
  expect(() => ScenarioFunctions.handleAttachedToTarget(mockMessage)).not.toThrow()
})

test('handleDetachedFromTarget removes session', () => {
  // Setup initial state
  SessionState.reset()
  const sessionId = 'test-session-123'

  // Add a session first
  SessionState.addSession(sessionId, {
    type: 'page',
    sessionId,
    rpc: {}
  })

  expect(SessionState.hasSession(sessionId)).toBe(true)

  // Handle detached from target
  const mockMessage = {
    params: {
      sessionId
    }
  }

  ScenarioFunctions.handleDetachedFromTarget(mockMessage)

  // Session should be removed
  expect(SessionState.hasSession(sessionId)).toBe(false)
})

test('handleAttachedToTarget with page type should setup session but fail without browser session', async () => {
  // Reset states
  SessionState.reset()
  TargetState.reset()

  // Mock console methods to suppress output during test
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  const mockMessage = {
    params: {
      sessionId: 'page-session-123',
      targetInfo: {
        type: DevtoolsTargetType.Page,
        targetId: 'page-target-123',
        url: 'https://example.com',
        browserContextId: 'context-123'
      }
    }
  }

  // This should not throw even if browser session doesn't exist
  // (the function handles errors internally)
  await expect(ScenarioFunctions.handleAttachedToTarget(mockMessage)).resolves.toBeUndefined()

  // Restore console methods
  consoleLogSpy.mockRestore()
  consoleErrorSpy.mockRestore()
})
