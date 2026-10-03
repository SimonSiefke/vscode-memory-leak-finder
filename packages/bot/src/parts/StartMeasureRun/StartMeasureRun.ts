import type { BotEnv } from '../Env/Env.ts'
import type { ParsedBotComment } from '../ParseBotComment/ParseBotComment.ts'
import { createCommentMarker } from '../CommentMarker/CommentMarker.ts'
import { deriveMeasureRequest } from '../DeriveMeasureRequest/DeriveMeasureRequest.ts'
import { dispatchMeasureWorkflow, type WorkflowDispatchOctokit } from '../DispatchMeasureWorkflow/DispatchMeasureWorkflow.ts'
import { renderStartedComment } from '../RenderStartedComment/RenderStartedComment.ts'
import { userDataSnapshotUnavailableMessage } from '../UserDataSnapshot/UserDataSnapshot.ts'

export type StartMeasureRunPullRequest = {
  readonly baseRef: string
  readonly baseSha: string
  readonly headOwnerLogin: string
  readonly headRef: string
  readonly htmlUrl: string
}

export type StartMeasureRunOctokit = WorkflowDispatchOctokit & {
  readonly rest: WorkflowDispatchOctokit['rest'] & {
    readonly issues: {
      readonly createComment: (options: {
        owner: string
        repo: string
        issue_number: number
        body: string
      }) => Promise<{ data: { id: number } }>
      readonly updateComment: (options: { owner: string; repo: string; comment_id: number; body: string }) => Promise<unknown>
    }
  }
}

type StartMeasureRunOptions = {
  readonly actorLogin: string
  readonly command: ParsedBotComment
  readonly commandCommentId: number
  readonly env: BotEnv
  readonly issueNumber: number
  readonly octokit: StartMeasureRunOctokit
  readonly pullRequest: StartMeasureRunPullRequest
  readonly requestId?: string
  readonly sourceRepository: {
    readonly owner: string
    readonly repo: string
  }
  readonly startedCommentIntro?: string
}

export const renderWorkflowStartFailureComment = (marker: string, errorMessage: string): string => {
  if (errorMessage === userDataSnapshotUnavailableMessage) {
    return `${marker}
## Measure run failed to start

No uploaded vscode-user-data-dir snapshot is available yet.

Upload a snapshot at /upload-user-data-dir and then retry the command.`
  }
  return `${marker}
## Measure run failed to start

\`\`\`text
${errorMessage}
\`\`\``
}

export const startMeasureRun = async ({
  actorLogin,
  command,
  commandCommentId,
  env,
  issueNumber,
  octokit,
  pullRequest,
  requestId,
  sourceRepository,
  startedCommentIntro,
}: StartMeasureRunOptions): Promise<void> => {
  const { owner, repo } = sourceRepository
  const request = deriveMeasureRequest({
    actorLogin,
    command,
    commentId: commandCommentId,
    issueNumber,
    pullRequest,
    sourceRepository,
    ...(requestId && { requestId }),
  })

  const placeholderComment = await octokit.rest.issues.createComment({
    body: 'Starting measure run...',
    issue_number: issueNumber,
    owner,
    repo,
  })

  const marker = createCommentMarker({
    requestId: request.requestId,
    sourceRepository: `${owner}/${repo}`,
    statusCommentId: placeholderComment.data.id,
  })

  let workflowRunUrl = ''

  try {
    workflowRunUrl = await dispatchMeasureWorkflow(octokit, env, request, placeholderComment.data.id)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await octokit.rest.issues.updateComment({
      body: renderWorkflowStartFailureComment(marker, errorMessage),
      comment_id: placeholderComment.data.id,
      owner,
      repo,
    })
    return
  }

  await octokit.rest.issues.updateComment({
    body: renderStartedComment(marker, request, workflowRunUrl, startedCommentIntro),
    comment_id: placeholderComment.data.id,
    owner,
    repo,
  })
}
