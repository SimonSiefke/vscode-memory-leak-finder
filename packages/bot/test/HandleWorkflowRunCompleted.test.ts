import { expect, jest, test } from '@jest/globals'
import type { MeasureWorkflowSummary } from '../src/parts/MeasureWorkflowSummary/MeasureWorkflowSummary.ts'
import { handleWorkflowRunCompleted } from '../src/parts/HandleWorkflowRunCompleted/HandleWorkflowRunCompleted.ts'

type UpdateCommentCall = {
  readonly body: string
  readonly comment_id: number
}

test('handleWorkflowRunCompleted includes bot-hosted failure video urls in the updated comment', async () => {
  const summary: MeasureWorkflowSummary = {
    actorLogin: 'SimonSiefke',
    artifacts: {
      baseVideo: 'measure-run-123-456-base-video',
      candidateVideo: 'measure-run-123-456-candidate-video',
      summary: 'measure-run-123-456-summary',
    },
    baseCommit: '0123456789abcdef0123456789abcdef01234567',
    candidateRef: 'SimonSiefke/feature/bot',
    cliArgs: ['--measure', 'named-function-count3', '--only', 'chat-editor-fix'],
    conclusion: 'failure',
    error: {
      message: 'candidate measure failed',
    },
    issueNumber: 2846,
    measure: 'named-function-count3',
    requestId: 'measure-run-123-456',
    sourceRepository: {
      owner: 'SimonSiefke',
      repo: 'vscode-memory-leak-finder',
    },
    statusCommentId: 9002,
    stepOutcomes: {
      baseMeasure: 'success',
      candidateMeasure: 'failure',
    },
    workflowRun: {
      id: 42,
      url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
    },
  }
  const downloadSummaryArtifact = jest.fn(async () => summary)
  const updateComment = jest.fn(async (_options: UpdateCommentCall) => ({}))

  await handleWorkflowRunCompleted(
    {
      octokit: {
        auth: async () => ({ token: 'test-installation-token' }),
        rest: {
          actions: {
            listWorkflowRunArtifacts: async () => {
              return {
                data: {
                  artifacts: [
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/10/zip',
                      id: 10,
                      name: 'measure-run-123-456-summary',
                    },
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/11/zip',
                      id: 11,
                      name: 'measure-run-123-456-base-video',
                    },
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/12/zip',
                      id: 12,
                      name: 'measure-run-123-456-candidate-video',
                    },
                  ],
                },
              }
            },
          },
          issues: {
            updateComment,
          },
          repos: {
            get: async () => {
              return {
                data: {
                  id: 99,
                },
              }
            },
          },
        },
      },
      payload: {
        installation: {
          id: 1,
        },
        repository: {
          name: 'vscode-memory-leak-finder',
          owner: {
            login: 'SimonSiefke',
          },
        },
        workflow_run: {
          conclusion: 'failure',
          html_url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
          id: 42,
          path: '.github/workflows/measure-on-demand.yml',
        },
      },
      publicBaseUrl: 'https://bot.example.com',
      workflowFileName: 'measure-on-demand.yml',
    },
    downloadSummaryArtifact,
  )

  expect(updateComment).toHaveBeenCalledTimes(1)
  const call = updateComment.mock.calls[0]?.[0] as UpdateCommentCall | undefined
  expect(call).toBeDefined()
  expect(call?.comment_id).toBe(9002)
  expect(call?.body).toContain('### Failure videos')
  expect(call?.body).toContain('Base revision video')
  expect(call?.body).toContain('Candidate revision video')
  expect(call?.body).toContain(
    '[measure-run-123-456-base-video](https://bot.example.com/api/workflow-artifacts/video?artifact_id=11&installation_id=1)',
  )
  expect(call?.body).toContain(
    '[measure-run-123-456-candidate-video](https://bot.example.com/api/workflow-artifacts/video?artifact_id=12&installation_id=1)',
  )
  expect(call?.body).not.toContain('### Artifacts')
})

test('handleWorkflowRunCompleted includes bot-hosted chart image urls in the updated comment', async () => {
  const summary: MeasureWorkflowSummary = {
    actorLogin: 'SimonSiefke',
    artifacts: {
      baseCharts: 'measure-run-123-456-base-charts',
      baseResults: 'measure-run-123-456-base-results',
      candidateCharts: 'measure-run-123-456-candidate-charts',
      candidateResults: 'measure-run-123-456-candidate-results',
      summary: 'measure-run-123-456-summary',
    },
    baseCommit: '0123456789abcdef0123456789abcdef01234567',
    candidateRef: 'SimonSiefke/feature/bot',
    chartPaths: {
      base: 'base-charts/extension-host/named-function-count-3/chat-editor-fix-node-built-in-test.svg',
      candidate: 'candidate-charts/extension-host/named-function-count-3/chat-editor-fix-node-built-in-test.svg',
    },
    cliArgs: ['--measure', 'named-function-count3'],
    conclusion: 'success',
    issueNumber: 2846,
    measure: 'named-function-count3',
    requestId: 'measure-run-123-456',
    sourceRepository: {
      owner: 'SimonSiefke',
      repo: 'vscode-memory-leak-finder',
    },
    statusCommentId: 9002,
    stepOutcomes: {
      baseMeasure: 'success',
      candidateMeasure: 'success',
      charts: 'success',
    },
    workflowRun: {
      id: 42,
      url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
    },
  }
  const downloadSummaryArtifact = jest.fn(async () => summary)
  const updateComment = jest.fn(async (_options: UpdateCommentCall) => ({}))

  await handleWorkflowRunCompleted(
    {
      octokit: {
        auth: async () => ({ token: 'test-installation-token' }),
        rest: {
          actions: {
            listWorkflowRunArtifacts: async () => {
              return {
                data: {
                  artifacts: [
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/10/zip',
                      id: 10,
                      name: 'measure-run-123-456-summary',
                    },
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/11/zip',
                      id: 11,
                      name: 'measure-run-123-456-base-charts',
                    },
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/12/zip',
                      id: 12,
                      name: 'measure-run-123-456-candidate-charts',
                    },
                    {
                      archive_download_url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/13/zip',
                      id: 13,
                      name: 'measure-run-123-456-base-results',
                    },
                  ],
                },
              }
            },
          },
          issues: {
            updateComment,
          },
          repos: {
            get: async () => {
              return {
                data: {
                  id: 99,
                },
              }
            },
          },
        },
      },
      payload: {
        installation: {
          id: 1,
        },
        repository: {
          name: 'vscode-memory-leak-finder',
          owner: {
            login: 'SimonSiefke',
          },
        },
        workflow_run: {
          conclusion: 'success',
          html_url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42',
          id: 42,
          path: '.github/workflows/measure-on-demand.yml',
        },
      },
      publicBaseUrl: 'https://bot.example.com',
      workflowFileName: 'measure-on-demand.yml',
    },
    downloadSummaryArtifact,
  )

  expect(updateComment).toHaveBeenCalledTimes(1)
  const call = updateComment.mock.calls[0]?.[0] as UpdateCommentCall | undefined
  expect(call).toBeDefined()
  expect(call?.body).toContain('### Before')
  expect(call?.body).toContain('### After')
  expect(call?.body).toContain(
    'src="https://bot.example.com/api/workflow-artifacts/chart/42/11/base-charts/extension-host/named-function-count-3/chat-editor-fix-node-built-in-test.svg"',
  )
  expect(call?.body).toContain(
    'src="https://bot.example.com/api/workflow-artifacts/chart/42/12/candidate-charts/extension-host/named-function-count-3/chat-editor-fix-node-built-in-test.svg"',
  )
  expect(call?.body).not.toContain('### Artifacts')
  expect(call?.body).not.toContain(
    '[measure-run-123-456-base-results](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/42/artifacts/13)',
  )
  expect(call?.body).not.toContain('measure-run-123-456-base-charts](https://github.com')
})
