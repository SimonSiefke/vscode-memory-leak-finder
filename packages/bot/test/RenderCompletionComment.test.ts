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
        id: 1,
        url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1',
      },
    },
  })

  expect(result).toContain('Measure run completed')
  expect(result).toContain('### Artifacts')
  expect(result).toContain('named-function-count3')
  expect(result).toContain('https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1')
  expect(result).toContain('<details>')
  expect(result).toContain('measure-run-123-456-base-results')
  expect(result).toContain('```json')
  expect(result).not.toContain('### Failure videos')
})

test('renderCompletionComment renders failure details', () => {
  const result = renderCompletionComment({
    artifacts: [],
    summary: {
      actorLogin: 'SimonSiefke',
      artifacts: {
        baseVideo: 'measure-run-123-456-base-video',
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
        id: 1,
        url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1',
      },
    },
    videoEmbeds: [
      {
        label: 'Base revision video',
        name: 'base-video.webm',
        url: 'https://github.com/user-attachments/assets/100b6d26-4252-47f5-831e-15c65eb52045',
      },
    ],
  })

  expect(result).toContain('Measure run failed')
  expect(result).toContain('candidate measure failed')
  expect(result).toContain('### Failure videos')
  expect(result).toContain('Base revision video')
  expect(result).toContain('[base-video.webm](https://github.com/user-attachments/assets/100b6d26-4252-47f5-831e-15c65eb52045)')
  expect(result).not.toContain('### Artifacts')
  expect(result).not.toContain('No downloadable artifacts were found for this run.')
})
