import { expect, test } from '@jest/globals'
import { deriveMeasureRequest } from '../src/parts/DeriveMeasureRequest/DeriveMeasureRequest.ts'

test('deriveMeasureRequest uses pr base sha and head owner branch by default', () => {
  const result = deriveMeasureRequest({
    actorLogin: 'SimonSiefke',
    commentId: 456,
    command: {
      cliArgs: ['--measure', 'named-function-count3', '--inspect-extensions'],
      command: 'run',
      flags: {
        inspectExtensions: true,
        inspectPtyHost: false,
        inspectSharedProcess: false,
        measure: 'named-function-count3',
        measureNode: false,
        restartBetween: false,
        runSkippedTestsAnyway: false,
      },
      mention: '@vscode-memory-leak-finder',
    },
    issueNumber: 123,
    pullRequest: {
      baseRef: 'main',
      baseSha: '0123456789abcdef0123456789abcdef01234567',
      headOwnerLogin: 'SimonSiefke',
      headRef: 'fix-memory-leak',
      htmlUrl: 'https://github.com/microsoft/vscode/pull/123',
    },
    sourceRepository: {
      owner: 'microsoft',
      repo: 'vscode',
    },
  })

  expect(result).toEqual({
    actorLogin: 'SimonSiefke',
    baseCommit: '0123456789abcdef0123456789abcdef01234567',
    candidateRef: 'SimonSiefke/fix-memory-leak',
    cliArgs: ['--measure', 'named-function-count3', '--inspect-extensions'],
    commentId: 456,
    issueNumber: 123,
    measure: 'named-function-count3',
    pullRequestHtmlUrl: 'https://github.com/microsoft/vscode/pull/123',
    requestId: 'measure-run-123-456',
    sourceRepository: {
      owner: 'microsoft',
      repo: 'vscode',
    },
    targetBaseRef: 'main',
  })
})
