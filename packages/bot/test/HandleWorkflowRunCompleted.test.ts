import { expect, jest, test } from '@jest/globals'
import JSZip from 'jszip'
import { handleWorkflowRunCompleted } from '../src/parts/HandleWorkflowRunCompleted/HandleWorkflowRunCompleted.ts'

type UpdateCommentCall = {
  readonly body: string
  readonly comment_id: number
}

const createSummaryArchive = async (summary: object): Promise<Buffer> => {
  const zip = new JSZip()
  zip.file('summary.json', JSON.stringify(summary, null, 2))
  return zip.generateAsync({ type: 'nodebuffer' })
}

test('handleWorkflowRunCompleted includes inline failure video urls in the updated comment', async () => {
  const originalFetch = globalThis.fetch
  const summaryArchive = await createSummaryArchive({
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
  })
  const updateComment = jest.fn(async (_options: UpdateCommentCall) => ({}))

  globalThis.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    if (url === 'https://github.com/upload/policies/assets') {
      const body = init?.body
      const entries = body instanceof FormData ? Array.from(body.entries()) : []
      const nameEntry = entries.find(([key]) => key === 'name')
      const assetId = nameEntry?.[1] === 'base-video.webm' ? 101 : 102
      const assetGuid = nameEntry?.[1] === 'base-video.webm' ? 'base-asset-guid' : 'candidate-asset-guid'
      return new Response(
        JSON.stringify({
          asset: {
            href: `https://github.com/user-attachments/assets/${assetGuid}`,
            id: assetId,
            name: nameEntry?.[1],
            original_name: nameEntry?.[1],
          },
          asset_upload_authenticity_token: `${assetId}-auth-token`,
          asset_upload_url: `/upload/assets/${assetId}`,
          form: {
            key: `${assetId}/${assetGuid}.webm`,
          },
          header: {},
          same_origin: false,
          upload_url: 'https://github-production-user-asset-6210df.s3.amazonaws.com',
        }),
        {
          status: 201,
          headers: {
            'content-type': 'application/json',
          },
        },
      )
    }
    if (url === 'https://github-production-user-asset-6210df.s3.amazonaws.com') {
      return new Response(null, {
        status: 204,
      })
    }
    if (url === 'https://github.com/upload/assets/101') {
      return new Response(
        JSON.stringify({
          href: 'https://github.com/user-attachments/assets/base-asset-guid',
          id: 101,
          name: 'base-video.webm',
          original_name: null,
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      )
    }
    if (url === 'https://github.com/upload/assets/102') {
      return new Response(
        JSON.stringify({
          href: 'https://github.com/user-attachments/assets/candidate-asset-guid',
          id: 102,
          name: 'candidate-video.webm',
          original_name: null,
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      )
    }
    if (url === 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/10/zip') {
      return new Response(summaryArchive, {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })
    }
    if (url === 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/11/zip') {
      const zip = new JSZip()
      zip.file('base-video.webm', Buffer.from('base-video-content'))
      return new Response(await zip.generateAsync({ type: 'nodebuffer' }), {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })
    }
    if (url === 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/actions/artifacts/12/zip') {
      const zip = new JSZip()
      zip.file('candidate-video.webm', Buffer.from('candidate-video-content'))
      return new Response(await zip.generateAsync({ type: 'nodebuffer' }), {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })
    }
    throw new Error(`Unexpected fetch request: ${url}`)
  }) as typeof fetch

  try {
    await handleWorkflowRunCompleted({
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
      workflowFileName: 'measure-on-demand.yml',
    })

    expect(updateComment).toHaveBeenCalledTimes(1)
    const call = updateComment.mock.calls[0]?.[0] as UpdateCommentCall | undefined
    expect(call).toBeDefined()
    expect(call?.comment_id).toBe(9002)
    expect(call?.body).toContain('### Failure videos')
    expect(call?.body).toContain('Base revision video')
    expect(call?.body).toContain('Candidate revision video')
    expect(call?.body).toContain('[base-video.webm](https://github.com/user-attachments/assets/base-asset-guid)')
    expect(call?.body).toContain('[candidate-video.webm](https://github.com/user-attachments/assets/candidate-asset-guid)')
    expect(call?.body).not.toContain('### Artifacts')
    expect(call?.body).not.toContain('/api/workflow-artifacts/video?')
  } finally {
    globalThis.fetch = originalFetch
  }
})
