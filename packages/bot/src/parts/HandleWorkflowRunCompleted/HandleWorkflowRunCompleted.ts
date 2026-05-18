import { downloadSummaryArtifact } from '../DownloadSummaryArtifact/DownloadSummaryArtifact.ts'
import { findSummaryArtifact } from '../FindSummaryArtifact/FindSummaryArtifact.ts'
import { renderCompletionComment } from '../RenderCompletionComment/RenderCompletionComment.ts'

type WorkflowRunArtifact = {
  readonly archive_download_url: string
  readonly id: number
  readonly name: string
}

type WorkflowRunPayload = {
  readonly repository: {
    readonly name: string
    readonly owner: {
      readonly login: string
    }
  }
  readonly workflow_run: {
    readonly conclusion: string | null
    readonly id: number
    readonly html_url: string
    readonly path?: string
  }
}

type WorkflowRunOctokit = {
  readonly auth: (options: { type: 'installation' }) => Promise<{ token: string } | unknown>
  readonly rest: {
    readonly actions: {
      readonly listWorkflowRunArtifacts: (options: {
        owner: string
        repo: string
        run_id: number
      }) => Promise<{ data: { artifacts: WorkflowRunArtifact[] } }>
    }
    readonly issues: {
      readonly updateComment: (options: { owner: string; repo: string; comment_id: number; body: string }) => Promise<unknown>
    }
  }
}

type HandleWorkflowRunCompletedOptions = {
  readonly octokit: WorkflowRunOctokit
  readonly payload: WorkflowRunPayload
  readonly workflowFileName: string
}

export const handleWorkflowRunCompleted = async ({
  octokit,
  payload,
  workflowFileName,
}: HandleWorkflowRunCompletedOptions): Promise<void> => {
  const workflowPath = payload.workflow_run.path || ''
  if (!workflowPath.includes(workflowFileName)) {
    return
  }

  const owner = payload.repository.owner.login
  const repo = payload.repository.name
  const runId = payload.workflow_run.id
  const artifactsResponse = await octokit.rest.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id: runId,
  })
  const summaryArtifact = findSummaryArtifact(artifactsResponse.data.artifacts)
  if (!summaryArtifact) {
    return
  }

  const summary = await downloadSummaryArtifact(octokit, summaryArtifact)
  const commentArtifacts = artifactsResponse.data.artifacts.map((artifact) => {
    return {
      name: artifact.name,
      url: `${payload.workflow_run.html_url}/artifacts/${artifact.id}`,
    }
  })

  await octokit.rest.issues.updateComment({
    owner: summary.sourceRepository.owner,
    repo: summary.sourceRepository.repo,
    comment_id: summary.statusCommentId,
    body: renderCompletionComment({
      artifacts: commentArtifacts,
      summary,
    }),
  })
}
