import type { BotEnv } from '../Env/Env.ts'
import { createRequestId } from '../CreateRequestId/CreateRequestId.ts'
import { isAuthorizedLogin } from '../IsAuthorizedLogin/IsAuthorizedLogin.ts'
import { parseBotComment, type ParsedBotComment } from '../ParseBotComment/ParseBotComment.ts'
import { startMeasureRun, type StartMeasureRunOctokit } from '../StartMeasureRun/StartMeasureRun.ts'

type PullRequestSynchronizePayload = {
  readonly action: string
  readonly pull_request: {
    readonly base: {
      readonly ref: string
      readonly sha: string
    }
    readonly head: {
      readonly ref: string
      readonly sha: string
      readonly repo: unknown
    }
    readonly html_url: string
    readonly number: number
  }
  readonly repository: {
    readonly name: string
    readonly owner: {
      readonly login: string
    }
  }
}

type PullRequestSynchronizeOctokit = StartMeasureRunOctokit & {
  readonly rest: StartMeasureRunOctokit['rest'] & {
    readonly issues: StartMeasureRunOctokit['rest']['issues'] & {
      readonly listComments: (options: { owner: string; repo: string; issue_number: number; page?: number; per_page: number }) => Promise<{
        data: {
          readonly body?: string
          readonly id: number
          readonly user?: {
            readonly login: string
          } | null
        }[]
      }>
    }
  }
}

type HandlePullRequestSynchronizeOptions = {
  readonly env: BotEnv
  readonly octokit: PullRequestSynchronizeOctokit
  readonly payload: PullRequestSynchronizePayload
}

type PreviousCommand = {
  readonly actorLogin: string
  readonly command: ParsedBotComment
  readonly commentId: number
}

type IssueComment = {
  readonly body?: string
  readonly id: number
  readonly user?: {
    readonly login: string
  } | null
}

const listAllComments = async (
  octokit: PullRequestSynchronizeOctokit,
  {
    issueNumber,
    owner,
    repo,
  }: {
    readonly issueNumber: number
    readonly owner: string
    readonly repo: string
  },
): Promise<readonly IssueComment[]> => {
  const comments: IssueComment[] = []
  for (let page = 1; ; page++) {
    const response = await octokit.rest.issues.listComments({
      issue_number: issueNumber,
      owner,
      page,
      per_page: 100,
      repo,
    })
    comments.push(...response.data)
    if (response.data.length < 100) {
      return comments
    }
  }
}

const findPreviousCommand = (comments: readonly IssueComment[], allowedLogins: readonly string[]): PreviousCommand | undefined => {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i]
    const actorLogin = comment.user?.login
    if (!actorLogin || !isAuthorizedLogin(allowedLogins, actorLogin)) {
      continue
    }
    const parsedCommand = parseBotComment(comment.body || '')
    if (parsedCommand.type !== 'success') {
      continue
    }
    return {
      actorLogin,
      command: parsedCommand.value,
      commentId: comment.id,
    }
  }
  return undefined
}

const getHeadOwnerLogin = (repo: unknown): string => {
  if (!repo || typeof repo !== 'object' || !('owner' in repo)) {
    return ''
  }
  const { owner } = repo
  if (!owner || typeof owner !== 'object' || !('login' in owner) || typeof owner.login !== 'string') {
    return ''
  }
  return owner.login
}

export const handlePullRequestSynchronize = async ({ env, octokit, payload }: HandlePullRequestSynchronizeOptions): Promise<void> => {
  if (payload.action !== 'synchronize') {
    return
  }

  const owner = payload.repository.owner.login
  const repo = payload.repository.name
  const issueNumber = payload.pull_request.number
  const comments = await listAllComments(octokit, {
    issueNumber,
    owner,
    repo,
  })
  const previousCommand = findPreviousCommand(comments, env.allowedLogins)
  if (!previousCommand) {
    return
  }
  const headOwnerLogin = getHeadOwnerLogin(payload.pull_request.head.repo)
  if (!headOwnerLogin) {
    return
  }

  await startMeasureRun({
    actorLogin: previousCommand.actorLogin,
    command: previousCommand.command,
    commandCommentId: previousCommand.commentId,
    env,
    issueNumber,
    octokit,
    pullRequest: {
      baseRef: payload.pull_request.base.ref,
      baseSha: payload.pull_request.base.sha,
      headOwnerLogin,
      headRef: payload.pull_request.head.ref,
      htmlUrl: payload.pull_request.html_url,
    },
    requestId: `${createRequestId(issueNumber, previousCommand.commentId)}-${payload.pull_request.head.sha.slice(0, 12)}`,
    sourceRepository: {
      owner,
      repo,
    },
    startedCommentIntro:
      'The bot found a previous measure command from an allowed user after the branch was updated and dispatched it again.',
  })
}
