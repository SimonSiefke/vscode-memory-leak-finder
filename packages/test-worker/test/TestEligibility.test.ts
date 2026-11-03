import { expect, test } from '@jest/globals'
import { testExclusionReason } from '../src/parts/TestEligibility/TestEligibility.ts'

test.each([
  [{}, '/tests/editor-open.ts', null],
  [{ skip: 1 }, '/tests/editor-open.ts', 'skip'],
  [{ skip: false }, '/tests/editor-open.ts', null],
  [{ skipInCi: true }, '/tests/editor-open.ts', 'skipInCi'],
  [{ requiresNetwork: true }, '/tests/editor-open.ts', 'requiresNetwork'],
  [{ requiresCopilotAuth: true }, '/tests/editor-open.ts', 'requiresCopilotAuth'],
  [{}, '/tests/chat-open.ts', 'requiresCopilotAuth'],
  [{}, 'C:\\tests\\terminal-inline-chat-open.ts', 'requiresCopilotAuth'],
] as const)('CI discovery excludes %j at %s with reason %s', (module, file, reason) => {
  expect(testExclusionReason(module, file, { isGithubActions: true })).toBe(reason)
})

test('focused opt-ins bypass only the ordinary skip flag', () => {
  const options = { isGithubActions: true, forceRun: true }
  expect(testExclusionReason({ skip: 1 }, '/tests/picker.ts', options)).toBeNull()
  expect(testExclusionReason({ skip: 1, skipInCi: true }, '/tests/picker.ts', options)).toBe('skipInCi')
  expect(testExclusionReason({ skip: 1, requiresNetwork: true }, '/tests/picker.ts', options)).toBe('requiresNetwork')
  expect(testExclusionReason({ skip: 1 }, '/tests/chat-picker.ts', options)).toBe('requiresCopilotAuth')
})

test('local policy and explicit CI allowances preserve normal E2E behavior', () => {
  expect(testExclusionReason({ skipInCi: true, requiresNetwork: true }, '/tests/chat-open.ts', { isGithubActions: false })).toBeNull()
  expect(
    testExclusionReason({ requiresNetwork: true }, '/tests/chat-open.ts', {
      isGithubActions: true,
      runNetworkTestsAnyway: true,
      allowCopilotAuthInCi: true,
    }),
  ).toBeNull()
  expect(testExclusionReason({ skip: 1 }, '/tests/editor.ts', { isGithubActions: false })).toBe('skip')
})
