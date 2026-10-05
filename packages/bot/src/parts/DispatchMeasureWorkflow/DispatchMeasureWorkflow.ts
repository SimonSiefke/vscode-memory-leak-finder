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
  }
}

const getWorkflowPageUrl = (env: BotEnv): string => {
  return `https://github.com/${env.workflowOwner}/${env.workflowRepo}/actions/workflows/${env.workflowFileName}`
}

const findTriggeredWorkflowRunUrl = async (octokit: WorkflowDispatchOctokit, env: BotEnv, request: MeasureRequest): Promise<string> => {
  try {
    const response = await octokit.rest.actions.listWorkflowRuns({
      branch: env.workflowRef,
      event: 'workflow_dispatch',
      owner: env.workflowOwner,
      per_page: 10,
      repo: env.workflowRepo,
      workflow_id: env.workflowFileName,
    })
    const expectedRunNamePrefix = `measure-run:${request.requestId}:`
    const workflowRun = response.data.workflow_runs.find((item) => item.name?.startsWith(expectedRunNamePrefix))
    return workflowRun?.html_url || getWorkflowPageUrl(env)
  } catch {
    return getWorkflowPageUrl(env)
  }
}

export const dispatchMeasureWorkflow = async (
  octokit: WorkflowDispatchOctokit,
  env: BotEnv,
  request: MeasureRequest,
  statusCommentId: number,
): Promise<string> => {
  const { downloadAllMockDataZipFileUrl, downloadUserDataZipFileToken, downloadUserDataZipFileUrl } = await getUserDataDownloadInfo(env)
  await octokit.rest.actions.createWorkflowDispatch({
    inputs: {
      base_commit: request.baseCommit,
      candidate_ref: request.candidateRef,
      cli_args: request.cliArgs.join(' '),
      download_all_mock_data_zip_file_url: downloadAllMockDataZipFileUrl,
      download_user_data_zip_file_token: downloadUserDataZipFileToken,
      download_user_data_zip_file_url: downloadUserDataZipFileUrl,
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
    owner: env.workflowOwner,
    ref: env.workflowRef,
    repo: env.workflowRepo,
    workflow_id: env.workflowFileName,
  })
  return findTriggeredWorkflowRunUrl(octokit, env, request)
}
