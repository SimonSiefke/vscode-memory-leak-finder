import type { ParsedBotComment } from '../ParseBotComment/ParseBotComment.ts'
import { createRequestId } from '../CreateRequestId/CreateRequestId.ts'

export type DeriveMeasureRequestOptions = {
  readonly actorLogin: string
  readonly commentId: number
  readonly command: ParsedBotComment
  readonly issueNumber: number
  readonly pullRequest: {
    readonly baseRef: string
    readonly baseSha: string
    readonly headOwnerLogin: string
    readonly headRef: string
    readonly htmlUrl: string
  }
  readonly sourceRepository: {
    readonly owner: string
    readonly repo: string
  }
  readonly requestId?: string
}

export type MeasureRequest = {
  readonly actorLogin: string
  readonly baseCommit: string
  readonly candidateRef: string
  readonly cliArgs: readonly string[]
  readonly commentId: number
  readonly issueNumber: number
  readonly measure: string
  readonly only: string
  readonly pullRequestHtmlUrl: string
  readonly requestId: string
  readonly sourceRepository: {
    readonly owner: string
    readonly repo: string
  }
  readonly targetBaseRef: string
}

export const deriveMeasureRequest = (options: DeriveMeasureRequestOptions): MeasureRequest => {
  const { actorLogin, command, commentId, issueNumber, pullRequest, requestId, sourceRepository } = options
  return {
    actorLogin,
    baseCommit: pullRequest.baseSha,
    candidateRef: `${pullRequest.headOwnerLogin}/${pullRequest.headRef}`,
    cliArgs: command.cliArgs,
    commentId,
    issueNumber,
    measure: command.flags.measure,
    only: command.flags.only,
    pullRequestHtmlUrl: pullRequest.htmlUrl,
    requestId: requestId || createRequestId(issueNumber, commentId),
    sourceRepository,
    targetBaseRef: pullRequest.baseRef,
  }
}
