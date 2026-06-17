import { expect, test } from '@jest/globals'
import { renderCompletionComment } from '../src/parts/RenderCompletionComment/RenderCompletionComment.ts'

test('renderCompletionComment renders success with artifacts and details', () => {
  const result = renderCompletionComment({
    chartEmbeds: [
      {
        alt: 'named-function-count3 base chart',
        label: 'Before',
        url: 'https://bot.example.com/api/workflow-artifacts/chart/1/98/base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
      },
      {
        alt: 'named-function-count3 candidate chart',
        label: 'After',
        url: 'https://bot.example.com/api/workflow-artifacts/chart/1/99/candidate-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
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
      chartPaths: {
        base: 'base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
        candidate: 'candidate-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
      },
      cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix', '--inspect-extensions'],
      conclusion: 'success',
      fixedFunctionNames: ['NotebookCellLinkifier', 'CodeBlocksMetadata'],
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
  expect(result).toContain('### Before')
  expect(result).toContain('Leaks: NotebookCellLinkifier, CodeBlocksMetadata.')
  expect(result).toContain('### After')
  expect(result).toContain(
    '<img alt="named-function-count3 base chart" src="https://bot.example.com/api/workflow-artifacts/chart/1/98/base-charts/extension-host/named-function-count-3/chat-editor-fix.svg" />',
  )
  expect(result).toContain(
    '<img alt="named-function-count3 candidate chart" src="https://bot.example.com/api/workflow-artifacts/chart/1/99/candidate-charts/extension-host/named-function-count-3/chat-editor-fix.svg" />',
  )
  expect(result).toContain('named-function-count3')
  expect(result).toContain('https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1')
  expect(result).toContain('<details>')
  expect(result).toContain('```json')
  expect(result).not.toContain('### Artifacts')
  expect(result).not.toContain(
    '[measure-run-123-456-base-results](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/1/artifacts/100)',
  )
  expect(result).not.toContain('### Failure videos')
})

test('renderCompletionComment truncates long fixed function lists above the before chart', () => {
  const result = renderCompletionComment({
    chartEmbeds: [
      {
        alt: 'named-function-count3 base chart',
        label: 'Before',
        url: 'https://bot.example.com/api/workflow-artifacts/chart/1/98/base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
      },
      {
        alt: 'named-function-count3 candidate chart',
        label: 'After',
        url: 'https://bot.example.com/api/workflow-artifacts/chart/1/99/candidate-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
      },
    ],
    summary: {
      actorLogin: 'SimonSiefke',
      artifacts: {
        summary: 'measure-run-123-456-summary',
      },
      baseCommit: '0123456789abcdef0123456789abcdef01234567',
      candidateRef: 'SimonSiefke/fix-memory-leak',
      chartPaths: {
        base: 'base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
        candidate: 'candidate-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
      },
      cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix', '--inspect-extensions'],
      conclusion: 'success',
      fixedFunctionNames: ['NotebookCellLinkifier', 'CodeBlocksMetadata', 'CopilotChatEndpoint', 'dispose'],
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

  expect(result).toContain('Leaks: NotebookCellLinkifier, CodeBlocksMetadata, CopilotChatEndpoint, and some others.')
})

test('renderCompletionComment renders no leaks message when candidate has no chart', () => {
  const result = renderCompletionComment({
    chartEmbeds: [
      {
        alt: 'named-function-count3 base chart',
        label: 'Before',
        url: 'https://bot.example.com/api/workflow-artifacts/chart/1/98/base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
      },
    ],
    summary: {
      actorLogin: 'SimonSiefke',
      artifacts: {
        baseCharts: 'measure-run-123-456-charts',
        candidateCharts: 'measure-run-123-456-charts',
        summary: 'measure-run-123-456-summary',
      },
      baseCommit: '0123456789abcdef0123456789abcdef01234567',
      candidateRef: 'SimonSiefke/fix-memory-leak',
      chartPaths: {
        base: 'base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
        candidate: '',
      },
      cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix', '--inspect-extensions'],
      conclusion: 'success',
      fixedFunctionNames: ['NotebookCellLinkifier', 'CodeBlocksMetadata'],
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

  expect(result).toContain('### Before')
  expect(result).toContain('Leaks: NotebookCellLinkifier, CodeBlocksMetadata.')
  expect(result).toContain('### After')
  expect(result).toContain('No more leaks detected')
  expect(result).toContain(
    '<img alt="named-function-count3 base chart" src="https://bot.example.com/api/workflow-artifacts/chart/1/98/base-charts/extension-host/named-function-count-3/chat-editor-fix.svg" />',
  )
})

test('renderCompletionComment renders before and after result text when charts are unavailable', () => {
  const result = renderCompletionComment({
    summary: {
      actorLogin: 'SimonSiefke',
      artifacts: {
        summary: 'measure-run-123-456-summary',
      },
      baseCommit: '0123456789abcdef0123456789abcdef01234567',
      candidateRef: 'SimonSiefke/fix-memory-leak',
      chartPaths: {
        base: 'base-charts/extension-host/named-function-count-3/chat-editor-fix.svg',
        candidate: '',
      },
      cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix', '--inspect-extensions'],
      conclusion: 'success',
      fixedFunctionNames: ['NotebookCellLinkifier', 'CodeBlocksMetadata'],
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

  expect(result).toContain('### Before')
  expect(result).toContain('Leaks: NotebookCellLinkifier, CodeBlocksMetadata.')
  expect(result).toContain('### After')
  expect(result).toContain('No more leaks detected')
})

test('renderCompletionComment renders failure details', () => {
  const result = renderCompletionComment({
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
        tscErrorLines: [
          "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/activitybar/activitybarPart.ts(286,34): Property 'menuService' is declared but its value is never read.",
          "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/paneCompositeBar.ts(96,20): Property 'viewDescriptorService' is declared but its value is never read.",
          '[15:16:14] Finished compilation with 2 errors after 169115 ms',
        ],
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
        url: 'https://bot.example.com/api/workflow-artifacts/video?artifact_id=100&installation_id=1',
      },
    ],
  })

  expect(result).toContain('Measure run failed')
  expect(result).toContain('### Compiler output')
  expect(result).toContain(
    "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/activitybar/activitybarPart.ts(286,34): Property 'menuService' is declared but its value is never read.",
  )
  expect(result).toContain('[15:16:14] Finished compilation with 2 errors after 169115 ms')
  expect(result).toContain('candidate measure failed')
  expect(result).toContain('### Failure videos')
  expect(result).toContain('Base revision video')
  expect(result).toContain('[base-video.webm](https://bot.example.com/api/workflow-artifacts/video?artifact_id=100&installation_id=1)')
  expect(result).not.toContain('### Artifacts')
  expect(result).not.toContain('No downloadable artifacts were found for this run.')
})
