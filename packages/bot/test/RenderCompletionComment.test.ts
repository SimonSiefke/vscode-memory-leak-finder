import { expect, test } from '@jest/globals'
import { renderCompletionComment } from '../src/parts/RenderCompletionComment/RenderCompletionComment.ts'

test('renderCompletionComment renders success with artifacts and details', () => {
  const result = renderCompletionComment({
    artifacts: [
      {
        name: 'measure-run-123-456-base-results',
        url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1/artifacts/100',
      },
      {
        name: 'measure-run-123-456-candidate-results',
        url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1/artifacts/101',
      },
    ],
    summary: {
      actorLogin: 'SimonSiefke',
      artifacts: {
        baseCharts: 'measure-run-123-456-base-charts',
        baseResults: 'measure-run-123-456-base-results',
        candidateCharts: 'measure-run-123-456-candidate-charts',
        candidateResults: 'measure-run-123-456-candidate-results',
        summary: 'measure-run-123-456-summary',
      },
      baseCommit: '0123456789abcdef0123456789abcdef01234567',
      candidateRef: 'SimonSiefke/fix-memory-leak',
      cliArgs: ['--measure', 'named-function-count3', '--inspect-extensions'],
      conclusion: 'success',
      issueNumber: 123,
      measure: 'named-function-count3',
      requestId: 'measure-run-123-456',
      sourceRepository: {
        owner: 'microsoft',
        repo: 'vscode',
      },
      statusCommentId: 999,
      stepOutcomes: {
        baseMeasure: 'success',
        candidateMeasure: 'success',
        charts: 'success',
      },
      workflowRun: {
        id: 1,
        url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1',
      },
    },
  })

  expect(result).toContain('Measure run completed')
  expect(result).toContain('named-function-count3')
  expect(result).toContain('https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1')
  expect(result).toContain('<details>')
  expect(result).toContain('measure-run-123-456-base-results')
  expect(result).toContain('```json')
})

test('renderCompletionComment renders failure details', () => {
  const result = renderCompletionComment({
    artifacts: [],
    summary: {
      actorLogin: 'SimonSiefke',
      artifacts: {
        summary: 'measure-run-123-456-summary',
      },
      baseCommit: '0123456789abcdef0123456789abcdef01234567',
      candidateRef: 'SimonSiefke/fix-memory-leak',
      cliArgs: ['--measure', 'named-function-count3'],
      conclusion: 'failure',
      error: {
        message: 'candidate measure failed',
      },
      issueNumber: 123,
      measure: 'named-function-count3',
      requestId: 'measure-run-123-456',
      sourceRepository: {
        owner: 'microsoft',
        repo: 'vscode',
      },
      statusCommentId: 999,
      stepOutcomes: {
        baseMeasure: 'success',
        candidateMeasure: 'failure',
      },
      workflowRun: {
        id: 1,
        url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1',
      },
    },
  })

  expect(result).toContain('Measure run failed')
  expect(result).toContain('candidate measure failed')
})
