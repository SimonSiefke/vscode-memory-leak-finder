import { createRequestId } from '../CreateRequestId/CreateRequestId.ts'
import type { ParsedBotComment } from '../ParseBotComment/ParseBotComment.ts'

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
}

export type MeasureRequest = {
  readonly actorLogin: string
  readonly baseCommit: string
  readonly candidateRef: string
  readonly cliArgs: readonly string[]
  readonly commentId: number
  readonly issueNumber: number
  readonly measure: string
  readonly pullRequestHtmlUrl: string
  readonly requestId: string
  readonly sourceRepository: {
    readonly owner: string
    readonly repo: string
  }
  readonly targetBaseRef: string
}

export const deriveMeasureRequest = (options: DeriveMeasureRequestOptions): MeasureRequest => {
  const { actorLogin, commentId, command, issueNumber, pullRequest, sourceRepository } = options
  return {
    actorLogin,
    baseCommit: pullRequest.baseSha,
    candidateRef: `${pullRequest.headOwnerLogin}/${pullRequest.headRef}`,
    cliArgs: command.cliArgs,
    commentId,
    issueNumber,
    measure: command.flags.measure,
    pullRequestHtmlUrl: pullRequest.htmlUrl,
    requestId: createRequestId(issueNumber, commentId),
    sourceRepository,
    targetBaseRef: pullRequest.baseRef,
  }
}
