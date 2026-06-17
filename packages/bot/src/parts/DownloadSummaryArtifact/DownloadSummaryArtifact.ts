import JSZip from 'jszip'
import { downloadArtifactArchive } from '../DownloadArtifactArchive/DownloadArtifactArchive.ts'
import type { MeasureWorkflowSummary } from '../MeasureWorkflowSummary/MeasureWorkflowSummary.ts'

type ArtifactRecord = {
  readonly archive_download_url: string
  readonly id: number
  readonly name: string
}

type ArtifactDownloadOctokit = {
  readonly auth: (options: { type: 'installation' }) => Promise<{ token: string } | unknown>
}

export const downloadSummaryArtifact = async (
  octokit: ArtifactDownloadOctokit,
  artifact: ArtifactRecord,
): Promise<MeasureWorkflowSummary> => {
  const archive = await downloadArtifactArchive(octokit, artifact)
  const zip = await JSZip.loadAsync(archive)
  const summaryFile = Object.values(zip.files).find((file) => file.name.endsWith('summary.json'))
  if (!summaryFile) {
    throw new Error(`Failed to find summary.json in artifact ${artifact.name}`)
  }
  const content = await summaryFile.async('string')
  return JSON.parse(content)
}
