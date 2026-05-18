import JSZip from 'jszip'
import type { MeasureWorkflowSummary } from '../MeasureWorkflowSummary/MeasureWorkflowSummary.ts'

type ArtifactRecord = {
  readonly archive_download_url: string
  readonly id: number
  readonly name: string
}

type ArtifactDownloadOctokit = {
  readonly auth: (options: { type: 'installation' }) => Promise<{ token: string } | unknown>
}

const getToken = async (octokit: ArtifactDownloadOctokit): Promise<string> => {
  const authResult = await octokit.auth({ type: 'installation' })
  if (!authResult || typeof authResult !== 'object' || !('token' in authResult) || typeof authResult.token !== 'string') {
    throw new Error('Failed to authenticate the artifact download request')
  }
  return authResult.token
}

export const downloadSummaryArtifact = async (
  octokit: ArtifactDownloadOctokit,
  artifact: ArtifactRecord,
): Promise<MeasureWorkflowSummary> => {
  const token = await getToken(octokit)
  const response = await fetch(artifact.archive_download_url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vscode-memory-leak-finder-bot',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to download summary artifact ${artifact.name}: ${response.status}`)
  }
  const archive = Buffer.from(await response.arrayBuffer())
  const zip = await JSZip.loadAsync(archive)
  const summaryFile = Object.values(zip.files).find((file) => file.name.endsWith('summary.json'))
  if (!summaryFile) {
    throw new Error(`Failed to find summary.json in artifact ${artifact.name}`)
  }
  const content = await summaryFile.async('string')
  return JSON.parse(content)
}
