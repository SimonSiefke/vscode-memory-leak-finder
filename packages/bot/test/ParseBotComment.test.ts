import { expect, test } from '@jest/globals'
import { parseBotComment } from '../src/parts/ParseBotComment/ParseBotComment.ts'

test('parseBotComment parses supported flags', () => {
  const result = parseBotComment(
    '@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --inspect-extensions --restart-between --run-network-tests-anyway',
  )

  expect(result).toEqual({
    type: 'success',
    value: {
      cliArgs: [
        '--measure',
        'named-function-count3',
        '--only',
        'chat-editor-fix',
        '--inspect-extensions',
        '--restart-between',
        '--run-network-tests-anyway',
      ],
      command: 'run',
      flags: {
        inspectExtensions: true,
        inspectPtyHost: false,
        inspectSharedProcess: false,
        measure: 'named-function-count3',
        measureNode: false,
        only: 'chat-editor-fix',
        restartBetween: true,
        runNetworkTestsAnyway: true,
        runSkippedTestsAnyway: false,
      },
      mention: '@vscode-memory-leak-finder',
    },
  })
})

test('parseBotComment rejects unknown flags', () => {
  const result = parseBotComment('@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --bad-flag')

  expect(result).toEqual({
    message:
      'Invalid command syntax. Unknown flag "--bad-flag". Supported flags: --measure <value>, --only <value>, --inspect-extensions, --inspect-shared-process, --inspect-ptyhost, --measure-node, --restart-between, --run-network-tests-anyway, --run-skipped-tests-anyway, --runs <value>, --process-root-strategy <value>.',
    type: 'error',
  })
})

test('parseBotComment rejects missing measure', () => {
  const result = parseBotComment('@vscode-memory-leak-finder-bot run --inspect-extensions')

  expect(result).toEqual({
    message:
      'Invalid command syntax. Missing required flag "--measure". Supported flags: --measure <value>, --only <value>, --inspect-extensions, --inspect-shared-process, --inspect-ptyhost, --measure-node, --restart-between, --run-network-tests-anyway, --run-skipped-tests-anyway, --runs <value>, --process-root-strategy <value>.',
    type: 'error',
  })
})

test('parseBotComment rejects missing only', () => {
  const result = parseBotComment('@vscode-memory-leak-finder-bot run --measure named-function-count3 --inspect-extensions')

  expect(result).toEqual({
    message:
      'Invalid command syntax. Missing required flag "--only". Supported flags: --measure <value>, --only <value>, --inspect-extensions, --inspect-shared-process, --inspect-ptyhost, --measure-node, --restart-between, --run-network-tests-anyway, --run-skipped-tests-anyway, --runs <value>, --process-root-strategy <value>.',
    type: 'error',
  })
})

test('parseBotComment ignores unrelated comments', () => {
  const result = parseBotComment('looks good to me')

  expect(result).toEqual({
    type: 'ignore',
  })
})

test('parseBotComment ignores upstream slash command', () => {
  const result = parseBotComment('/upstream')

  expect(result).toEqual({
    type: 'ignore',
  })
})
