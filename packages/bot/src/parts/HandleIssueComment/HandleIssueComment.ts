import type { BotEnv } from '../Env/Env.ts'
import { isAuthorizedLogin } from '../IsAuthorizedLogin/IsAuthorizedLogin.ts'
import { parseBotComment } from '../ParseBotComment/ParseBotComment.ts'
import { renderInvalidCommandComment } from '../RenderInvalidCommandComment/RenderInvalidCommandComment.ts'
import { startMeasureRun } from '../StartMeasureRun/StartMeasureRun.ts'

type PullRequestData = {
  readonly base: {
    readonly ref: string
    readonly sha: string
  }
  readonly head: {
    readonly ref: string
    readonly repo: {
      readonly full_name?: string
      readonly owner: {
        readonly login: string
      }
    }
  }
  readonly html_url: string
  readonly title: string
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
      body: 'Bot commands can only be started from pull request comments.',
    })
    return
  }

  const pullRequest = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: issueNumber,
  })

  await startMeasureRun({
    actorLogin,
    command: parsedCommand.value,
    commandCommentId: payload.comment.id,
    env,
    issueNumber,
    octokit,
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
}
