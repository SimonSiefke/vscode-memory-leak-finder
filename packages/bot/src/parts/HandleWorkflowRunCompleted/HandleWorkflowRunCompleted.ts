import { downloadSummaryArtifact } from '../DownloadSummaryArtifact/DownloadSummaryArtifact.ts'
import { findSummaryArtifact } from '../FindSummaryArtifact/FindSummaryArtifact.ts'
import { getWorkflowArtifactChartUrl } from '../GetWorkflowArtifactChartUrl/GetWorkflowArtifactChartUrl.ts'
import { getWorkflowArtifactVideoUrl } from '../GetWorkflowArtifactVideoUrl/GetWorkflowArtifactVideoUrl.ts'
import { renderCompletionComment } from '../RenderCompletionComment/RenderCompletionComment.ts'

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
  readonly publicBaseUrl: string
  readonly workflowFileName: string
}

type SummaryArtifactDownloader = typeof downloadSummaryArtifact

type CompletionSummary = Awaited<ReturnType<SummaryArtifactDownloader>>

const getVideoEmbeds = async ({
  artifacts,
  installationId,
  publicBaseUrl,
  summary,
}: {
  readonly artifacts: readonly WorkflowRunArtifact[]
  readonly installationId: number | undefined
  readonly publicBaseUrl: string
  readonly summary: CompletionSummary
}): Promise<
  {
    readonly label: string
    readonly name: string
    readonly url: string
  }[]
> => {
  if (summary.conclusion !== 'failure' || !installationId || !publicBaseUrl) {
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
  const videoEmbeds = []
  for (const candidate of candidates) {
    if (!candidate.artifactName) {
      continue
    }
    const artifact = artifacts.find((item) => item.name === candidate.artifactName)
    if (!artifact) {
      continue
    }
    videoEmbeds.push({
      label: candidate.label,
      name: artifact.name,
      url: getWorkflowArtifactVideoUrl(publicBaseUrl, installationId, artifact.id),
    })
  }
  return videoEmbeds
}

const getChartEmbeds = ({
  artifacts,
  publicBaseUrl,
  runId,
  summary,
}: {
  readonly artifacts: readonly WorkflowRunArtifact[]
  readonly publicBaseUrl: string
  readonly runId: number
  readonly summary: CompletionSummary
}): {
  readonly alt: string
  readonly artifactName: string
  readonly label: string
  readonly url: string
}[] => {
  if (summary.conclusion !== 'success' || !publicBaseUrl) {
    return []
  }
  const candidates = [
    {
      alt: `${summary.measure} base chart`,
      artifactName: summary.artifacts.baseCharts,
      chartPath: summary.chartPaths?.base,
      label: 'Before',
    },
    {
      alt: `${summary.measure} candidate chart`,
      artifactName: summary.artifacts.candidateCharts,
      chartPath: summary.chartPaths?.candidate,
      label: 'After',
    },
  ]
  const chartEmbeds = []
  for (const candidate of candidates) {
    if (!candidate.artifactName || !candidate.chartPath) {
      continue
    }
    const artifact = artifacts.find((item) => item.name === candidate.artifactName)
    if (!artifact) {
      continue
    }
    chartEmbeds.push({
      alt: candidate.alt,
      artifactName: candidate.artifactName,
      label: candidate.label,
      url: getWorkflowArtifactChartUrl(publicBaseUrl, runId, artifact.id, candidate.chartPath),
    })
  }
  return chartEmbeds
}

export const handleWorkflowRunCompleted = async (
  { octokit, payload, publicBaseUrl, workflowFileName }: HandleWorkflowRunCompletedOptions,
  downloadSummaryArtifactFn: SummaryArtifactDownloader = downloadSummaryArtifact,
): Promise<void> => {
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

  const summary = await downloadSummaryArtifactFn(octokit, summaryArtifact)
  const chartEmbeds = getChartEmbeds({
    artifacts: artifactsResponse.data.artifacts,
    publicBaseUrl,
    runId,
    summary,
  })
  const videoEmbeds = await getVideoEmbeds({
    artifacts: artifactsResponse.data.artifacts,
    installationId: payload.installation?.id,
    publicBaseUrl,
    summary,
  })

  await octokit.rest.issues.updateComment({
    owner: summary.sourceRepository.owner,
    repo: summary.sourceRepository.repo,
    comment_id: summary.statusCommentId,
    body: renderCompletionComment({
      chartEmbeds,
      summary,
      videoEmbeds,
    }),
  })
}
