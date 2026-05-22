import { downloadSummaryArtifact } from '../DownloadSummaryArtifact/DownloadSummaryArtifact.ts'
import { findSummaryArtifact } from '../FindSummaryArtifact/FindSummaryArtifact.ts'
import { renderCompletionComment } from '../RenderCompletionComment/RenderCompletionComment.ts'
import { uploadWorkflowArtifactVideo } from '../UploadWorkflowArtifactVideo/UploadWorkflowArtifactVideo.ts'

type WorkflowRunArtifact = {
  readonly archive_download_url: string
  readonly id: number
  readonly name: string
}

type WorkflowRunPayload = {
  readonly installation?: {
    readonly id: number
  }
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
    readonly repos: {
      readonly get: (options: { owner: string; repo: string }) => Promise<{ data: { id: number } }>
    }
  }
}

type HandleWorkflowRunCompletedOptions = {
  readonly octokit: WorkflowRunOctokit
  readonly payload: WorkflowRunPayload
  readonly workflowFileName: string
}

const getVideoEmbeds = async ({
  artifacts,
  octokit,
  repositoryId,
  summary,
}: {
  readonly artifacts: readonly WorkflowRunArtifact[]
  readonly octokit: WorkflowRunOctokit
  readonly repositoryId: number
  readonly summary: ReturnType<typeof downloadSummaryArtifact extends (...args: never[]) => Promise<infer T> ? () => T : never>
}): Promise<
  {
    readonly label: string
    readonly name: string
    readonly url: string
  }[]
> => {
  if (summary.conclusion !== 'failure') {
    return []
  }
  const candidates = [
    {
      artifactName: summary.artifacts.baseVideo,
      label: 'Base revision video',
    },
    {
      artifactName: summary.artifacts.candidateVideo,
      label: 'Candidate revision video',
    },
  ]
  const uploadedVideos = []
  for (const candidate of candidates) {
    if (!candidate.artifactName) {
      continue
    }
    const artifact = artifacts.find((item) => item.name === candidate.artifactName)
    if (!artifact) {
      continue
    }
    try {
      const uploadedAsset = await uploadWorkflowArtifactVideo({
        artifact,
        octokit,
        repositoryId,
      })
      uploadedVideos.push({
        label: candidate.label,
        name: uploadedAsset.name,
        url: uploadedAsset.url,
      })
    } catch {
      // Keep the summary comment update working even if a video upload fails.
    }
  }
  return uploadedVideos
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
  const sourceRepository = await octokit.rest.repos.get({
    owner: summary.sourceRepository.owner,
    repo: summary.sourceRepository.repo,
  })
  const commentArtifacts = artifactsResponse.data.artifacts.map((artifact) => {
    return {
      name: artifact.name,
      url: `${payload.workflow_run.html_url}/artifacts/${artifact.id}`,
    }
  })
  const videoEmbeds = await getVideoEmbeds({
    artifacts: artifactsResponse.data.artifacts,
    octokit,
    repositoryId: sourceRepository.data.id,
    summary,
  })

  await octokit.rest.issues.updateComment({
    owner: summary.sourceRepository.owner,
    repo: summary.sourceRepository.repo,
    comment_id: summary.statusCommentId,
    body: renderCompletionComment({
      artifacts: commentArtifacts,
      summary,
      videoEmbeds,
    }),
  })
}
