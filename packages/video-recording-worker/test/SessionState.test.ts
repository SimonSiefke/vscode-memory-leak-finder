import { expect, test } from '@jest/globals'
import * as SessionState from '../src/parts/SessionState/SessionState.ts'

test('initial state has empty session map', () => {
  SessionState.reset()
  expect(Object.keys(SessionState.state.sessionMap).length).toBe(0)
})

test('addSession adds session to map', () => {
  SessionState.reset()
  const sessionId = 'test-session'
  const session = {
    type: 'page',
    objectType: 'page',
    url: 'https://example.com',
    sessionId,
    rpc: {},
  }

  SessionState.addSession(sessionId, session)
  expect(SessionState.hasSession(sessionId)).toBe(true)
  expect(SessionState.getSession(sessionId)).toBe(session)
})

test('removeSession removes session from map', () => {
  SessionState.reset()
  const sessionId = 'test-session'
  const session = { type: 'page', sessionId, rpc: {} }

  SessionState.addSession(sessionId, session)
  expect(SessionState.hasSession(sessionId)).toBe(true)

  SessionState.removeSession(sessionId)
  expect(SessionState.hasSession(sessionId)).toBe(false)
})

test('hasSession returns false for non-existent session', () => {
  SessionState.reset()
  expect(SessionState.hasSession('non-existent')).toBe(false)
})

test('getAllSessions returns all sessions', () => {
  SessionState.reset()
  const session1 = { type: 'page', sessionId: 'session1', rpc: {} }
  const session2 = { type: 'browser', sessionId: 'session2', rpc: {} }

  SessionState.addSession('session1', session1)
  SessionState.addSession('session2', session2)

  const allSessions = SessionState.getAllSessions()
  expect(allSessions.length).toBe(2)
  expect(allSessions).toContain(session1)
  expect(allSessions).toContain(session2)
})

test('getPageSession returns page type session', () => {
  SessionState.reset()
  const pageSession = { type: 'page', sessionId: 'page1', rpc: {} }
  const browserSession = { type: 'browser', sessionId: 'browser1', rpc: {} }

  SessionState.addSession('page1', pageSession)
  SessionState.addSession('browser1', browserSession)

  const result = SessionState.getPageSession()
  expect(result).toBe(pageSession)
})

test('getPageSession returns undefined when no page session exists', () => {
  SessionState.reset()
  const browserSession = { type: 'browser', sessionId: 'browser1', rpc: {} }
  SessionState.addSession('browser1', browserSession)

  const result = SessionState.getPageSession()
  expect(result).toBeUndefined()
})
