import { expect, test } from '@jest/globals'
import { createMeasureWorkflowSummary } from '../src/createMeasureWorkflowSummary.ts'

test('createMeasureWorkflowSummary returns success summary with artifact names', () => {
  const result = createMeasureWorkflowSummary({
    actorLogin: 'SimonSiefke',
    artifactNames: {
      baseCharts: 'measure-run-123-456-base-charts',
      baseResults: 'measure-run-123-456-base-results',
      candidateCharts: 'measure-run-123-456-candidate-charts',
      candidateResults: 'measure-run-123-456-candidate-results',
      summary: 'measure-run-123-456-summary',
    },
    baseCommit: '0123456789abcdef0123456789abcdef01234567',
    candidateRef: 'SimonSiefke/fix-memory-leak',
    cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix', '--inspect-extensions'],
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
      id: 42,
      url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
    },
  })

  expect(result).toEqual({
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
    cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix', '--inspect-extensions'],
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
      id: 42,
      url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
    },
  })
})

test('createMeasureWorkflowSummary includes error payload for failed runs', () => {
  const result = createMeasureWorkflowSummary({
    actorLogin: 'SimonSiefke',
    artifactNames: {
      summary: 'measure-run-123-456-summary',
    },
    baseCommit: '0123456789abcdef0123456789abcdef01234567',
    candidateRef: 'SimonSiefke/fix-memory-leak',
    cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix'],
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
      id: 42,
      url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
    },
  })

  expect(result).toEqual({
    actorLogin: 'SimonSiefke',
    artifacts: {
      summary: 'measure-run-123-456-summary',
    },
    baseCommit: '0123456789abcdef0123456789abcdef01234567',
    candidateRef: 'SimonSiefke/fix-memory-leak',
    cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix'],
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
      id: 42,
      url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
    },
  })
})
