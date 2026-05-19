import type { MeasureRequest } from '../DeriveMeasureRequest/DeriveMeasureRequest.ts'
import type { BotEnv } from '../Env/Env.ts'
import { getUserDataDownloadInfo } from '../UserDataSnapshot/UserDataSnapshot.ts'

export type WorkflowDispatchOctokit = {
  readonly rest: {
    readonly actions: {
      readonly createWorkflowDispatch: (options: {
        owner: string
        repo: string
        workflow_id: string
        ref: string
        inputs: Record<string, string>
      }) => Promise<unknown>
    }
  }
}

export const dispatchMeasureWorkflow = async (
  octokit: WorkflowDispatchOctokit,
  env: BotEnv,
  request: MeasureRequest,
  statusCommentId: number,
): Promise<void> => {
  const { downloadUserDataZipFileToken, downloadUserDataZipFileUrl } = await getUserDataDownloadInfo(env)
  const cliArgs = [...request.cliArgs, '--download-user-data-zip-file-url', downloadUserDataZipFileUrl]
  await octokit.rest.actions.createWorkflowDispatch({
    owner: env.workflowOwner,
    repo: env.workflowRepo,
    workflow_id: env.workflowFileName,
    ref: env.workflowRef,
    inputs: {
      base_commit: request.baseCommit,
      candidate_ref: request.candidateRef,
      cli_args: cliArgs.join(' '),
      download_user_data_zip_file_token: downloadUserDataZipFileToken,
      measure: request.measure,
      only: request.only,
      request_id: request.requestId,
      source_actor: request.actorLogin,
      source_comment_id: String(request.commentId),
      source_issue_number: String(request.issueNumber),
      source_owner: request.sourceRepository.owner,
      source_pull_request_url: request.pullRequestHtmlUrl,
      source_repo: request.sourceRepository.repo,
      status_comment_id: String(statusCommentId),
      target_base_ref: request.targetBaseRef,
    },
  })
}
