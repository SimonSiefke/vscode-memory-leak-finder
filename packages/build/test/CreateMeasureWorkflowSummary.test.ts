import { expect, test } from '@jest/globals'
import { createMeasureWorkflowSummary, extractTscErrorLines, getFixedFunctionNamesFromItems } from '../src/createMeasureWorkflowSummary.ts'

test('createMeasureWorkflowSummary returns success summary with artifact names', () => {
  const result = createMeasureWorkflowSummary({
    actorLogin: 'SimonSiefke',
    artifactNames: {
      baseCharts: 'measure-run-123-456-base-charts',
      baseResults: 'measure-run-123-456-base-results',
      baseVideo: 'measure-run-123-456-base-video',
      candidateCharts: 'measure-run-123-456-candidate-charts',
      candidateResults: 'measure-run-123-456-candidate-results',
      candidateVideo: 'measure-run-123-456-candidate-video',
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
    workflowDurationMs: 3_723_000,
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
      baseVideo: 'measure-run-123-456-base-video',
      candidateCharts: 'measure-run-123-456-candidate-charts',
      candidateResults: 'measure-run-123-456-candidate-results',
      candidateVideo: 'measure-run-123-456-candidate-video',
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
    workflowDurationMs: 3_723_000,
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

test('extractTscErrorLines returns timestamped tsc errors and compilation summary lines', () => {
  const log = `
[15:13:25] Starting compilation...
[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/activitybar/activitybarPart.ts(286,34): Property 'menuService' is declared but its value is never read.
[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/paneCompositeBar.ts(96,20): Property 'viewDescriptorService' is declared but its value is never read.
[15:16:14] Finished compilation with 2 errors after 169115 ms
[15:16:14] [compile] errored after 3.5 min
stderr:
[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/activitybar/activitybarPart.ts(286,34): Property 'menuService' is declared but its value is never read.
[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/paneCompositeBar.ts(96,20): Property 'viewDescriptorService' is declared but its value is never read.
[15:16:14] Finished compilation with 2 errors after 169115 ms
`

  expect(extractTscErrorLines(log)).toEqual([
    "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/activitybar/activitybarPart.ts(286,34): Property 'menuService' is declared but its value is never read.",
    "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/paneCompositeBar.ts(96,20): Property 'viewDescriptorService' is declared but its value is never read.",
    '[15:16:14] Finished compilation with 2 errors after 169115 ms',
    "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/activitybar/activitybarPart.ts(286,34): Property 'menuService' is declared but its value is never read.",
    "[15:16:14] Error: /home/runner/work/vscode-memory-leak-finder-2/vscode-memory-leak-finder-2/.vscode-repos/default/src/vs/workbench/browser/parts/paneCompositeBar.ts(96,20): Property 'viewDescriptorService' is declared but its value is never read.",
    '[15:16:14] Finished compilation with 2 errors after 169115 ms',
  ])
})

test('getFixedFunctionNamesFromItems only returns functions absent from candidate results', () => {
  const result = getFixedFunctionNamesFromItems(
    [
      { count: 100, name: 'StillLeaking' },
      { count: 80, name: 'GoneFunction' },
      { count: 60, name: 'anonymous' },
      { count: 40, name: 'anonymous' },
    ],
    [
      { count: 10, name: 'StillLeaking' },
      { count: 5, name: 'anonymous' },
    ],
  )

  expect(result).toEqual(['GoneFunction', 'anonymous (2)'])
})

test('getFixedFunctionNamesFromItems returns all base functions when candidate has no leaks', () => {
  const result = getFixedFunctionNamesFromItems(
    [
      { count: 100, name: 'NotebookCellLinkifier' },
      { count: 80, name: 'CodeBlocksMetadata' },
    ],
    [],
  )

  expect(result).toEqual(['NotebookCellLinkifier', 'CodeBlocksMetadata'])
})
