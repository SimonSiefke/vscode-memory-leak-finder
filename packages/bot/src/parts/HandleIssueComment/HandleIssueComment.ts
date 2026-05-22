import { createCommentMarker } from '../CommentMarker/CommentMarker.ts'
import { deriveMeasureRequest } from '../DeriveMeasureRequest/DeriveMeasureRequest.ts'
import { dispatchMeasureWorkflow } from '../DispatchMeasureWorkflow/DispatchMeasureWorkflow.ts'
import type { BotEnv } from '../Env/Env.ts'
import { isAuthorizedLogin } from '../IsAuthorizedLogin/IsAuthorizedLogin.ts'
import { parseBotComment } from '../ParseBotComment/ParseBotComment.ts'
import { renderInvalidCommandComment } from '../RenderInvalidCommandComment/RenderInvalidCommandComment.ts'
import { renderStartedComment } from '../RenderStartedComment/RenderStartedComment.ts'
import { userDataSnapshotUnavailableMessage } from '../UserDataSnapshot/UserDataSnapshot.ts'

type PullRequestData = {
  readonly base: {
    readonly ref: string
    readonly sha: string
  }
  readonly head: {
    readonly ref: string
    readonly repo: {
      readonly owner: {
        readonly login: string
      }
    }
  }
  readonly html_url: string
}

type IssueCommentPayload = {
  readonly comment: {
    readonly body: string
    readonly id: number
    readonly user: {
      readonly login: string
    } | null
  }
  readonly issue: {
    readonly number: number
    readonly pull_request?: {
      readonly url?: string
    }
  }
  readonly repository: {
    readonly name: string
    readonly owner: {
      readonly login: string
    }
  }
}

type IssueCommentOctokit = {
  readonly rest: {
    readonly actions: {
      readonly createWorkflowDispatch: (options: {
        owner: string
        repo: string
        workflow_id: string
        ref: string
        inputs: Record<string, string>
      }) => Promise<unknown>
      readonly listWorkflowRuns: (options: {
        owner: string
        repo: string
        workflow_id: string
        branch: string
        event: string
        per_page: number
      }) => Promise<{
        data: {
          workflow_runs: {
            readonly html_url: string
            readonly name?: string | null
          }[]
        }
      }>
    }
    readonly issues: {
      readonly createComment: (options: {
        owner: string
        repo: string
        issue_number: number
        body: string
      }) => Promise<{ data: { id: number } }>
      readonly updateComment: (options: { owner: string; repo: string; comment_id: number; body: string }) => Promise<unknown>
    }
    readonly pulls: {
      readonly get: (options: { owner: string; repo: string; pull_number: number }) => Promise<{ data: PullRequestData }>
    }
  }
}

type HandleIssueCommentOptions = {
  readonly env: BotEnv
  readonly octokit: IssueCommentOctokit
  readonly payload: IssueCommentPayload
}

const renderWorkflowStartFailureComment = (marker: string, errorMessage: string): string => {
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

export const handleIssueComment = async ({ env, octokit, payload }: HandleIssueCommentOptions): Promise<void> => {
  if (!payload.comment.user) {
    return
  }

  const actorLogin = payload.comment.user.login
  if (!isAuthorizedLogin(env.allowedLogins, actorLogin)) {
    return
  }

  const parsedCommand = parseBotComment(payload.comment.body)
  if (parsedCommand.type === 'ignore') {
    return
  }

  const owner = payload.repository.owner.login
  const repo = payload.repository.name
  const issueNumber = payload.issue.number

  if (parsedCommand.type === 'error') {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: renderInvalidCommandComment(parsedCommand.message),
    })
    return
  }

  if (!payload.issue.pull_request) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: 'Measure runs can only be started from pull request comments.',
    })
    return
  }

  const pullRequest = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: issueNumber,
  })

  const request = deriveMeasureRequest({
    actorLogin,
    commentId: payload.comment.id,
    command: parsedCommand.value,
    issueNumber,
    pullRequest: {
      baseRef: pullRequest.data.base.ref,
      baseSha: pullRequest.data.base.sha,
      headOwnerLogin: pullRequest.data.head.repo.owner.login,
      headRef: pullRequest.data.head.ref,
      htmlUrl: pullRequest.data.html_url,
    },
    sourceRepository: {
      owner,
      repo,
    },
  })

  const placeholderComment = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: 'Starting measure run...',
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
      owner,
      repo,
      comment_id: placeholderComment.data.id,
      body: renderWorkflowStartFailureComment(marker, errorMessage),
    })
    return
  }

  await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: placeholderComment.data.id,
    body: renderStartedComment(marker, request, workflowRunUrl),
  })
}
