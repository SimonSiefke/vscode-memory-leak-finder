import JSZip from 'jszip'
import { downloadArtifactArchive } from '../DownloadArtifactArchive/DownloadArtifactArchive.ts'

type WorkflowArtifact = {
  readonly archive_download_url: string
  readonly name: string
}

type UploadWorkflowArtifactVideoOctokit = {
  readonly auth: (options: { type: 'installation' }) => Promise<{ token: string } | unknown>
}

type UploadAssetPolicyResponse = {
  readonly asset: {
    readonly href: string
    readonly id: number
    readonly name: string
    readonly original_name: string | null
  }
  readonly asset_upload_authenticity_token: string
  readonly asset_upload_url: string
  readonly form: Record<string, string>
  readonly upload_url: string
}

type UploadAssetFinalizeResponse = {
  readonly href: string
  readonly name: string
  readonly original_name: string | null
}

type UploadedWorkflowArtifactVideo = {
  readonly name: string
  readonly url: string
}

const getToken = async (octokit: UploadWorkflowArtifactVideoOctokit): Promise<string> => {
  const authResult = await octokit.auth({ type: 'installation' })
  if (!authResult || typeof authResult !== 'object' || !('token' in authResult) || typeof authResult.token !== 'string') {
    throw new Error('Failed to authenticate the asset upload request')
  }
  return authResult.token
}

const getVideoContentType = (fileName: string): string => {
  if (fileName.endsWith('.mp4')) {
    return 'video/mp4'
  }
  if (fileName.endsWith('.mov')) {
    return 'video/quicktime'
  }
  return 'video/webm'
}

const readWorkflowArtifactVideo = async (
  octokit: UploadWorkflowArtifactVideoOctokit,
  artifact: WorkflowArtifact,
): Promise<{ fileName: string; content: Buffer; contentType: string }> => {
  const archive = await downloadArtifactArchive(octokit, artifact)
  const zip = await JSZip.loadAsync(archive)
  const videoFile = Object.values(zip.files).find((file) => !file.dir && /\.(webm|mp4|mov)$/i.test(file.name))
  if (!videoFile) {
    throw new Error(`Failed to find a video file in artifact ${artifact.name}`)
  }
  const fileName = videoFile.name.split('/').pop() || `${artifact.name}.webm`
  const content = Buffer.from(await videoFile.async('uint8array'))
  return {
    content,
    contentType: getVideoContentType(fileName.toLowerCase()),
    fileName,
  }
}

const requestUploadPolicy = async ({
  contentType,
  fileName,
  repositoryId,
  size,
  token,
}: {
  readonly contentType: string
  readonly fileName: string
  readonly repositoryId: number
  readonly size: number
  readonly token: string
}): Promise<UploadAssetPolicyResponse> => {
  const formData = new FormData()
  formData.append('repository_id', String(repositoryId))
  formData.append('name', fileName)
  formData.append('size', String(size))
  formData.append('content_type', contentType)
  const response = await fetch('https://github.com/upload/policies/assets', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vscode-memory-leak-finder-bot',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: formData,
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Failed to request an upload policy for ${fileName}: ${response.status}`)
  }
  return (await response.json()) as UploadAssetPolicyResponse
}

const uploadAssetContent = async ({
  content,
  contentType,
  fileName,
  policy,
}: {
  readonly content: Buffer
  readonly contentType: string
  readonly fileName: string
  readonly policy: UploadAssetPolicyResponse
}): Promise<void> => {
  const formData = new FormData()
  for (const [key, value] of Object.entries(policy.form)) {
    formData.append(key, value)
  }
  formData.append('file', new Blob([content], { type: contentType }), fileName)
  const response = await fetch(policy.upload_url, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Failed to upload ${fileName} to GitHub asset storage: ${response.status}`)
  }
}

const finalizeUploadedAsset = async ({
  policy,
  token,
}: {
  readonly policy: UploadAssetPolicyResponse
  readonly token: string
}): Promise<UploadAssetFinalizeResponse> => {
  const formData = new FormData()
  formData.append('authenticity_token', policy.asset_upload_authenticity_token)
  const response = await fetch(new URL(policy.asset_upload_url, 'https://github.com'), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vscode-memory-leak-finder-bot',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: formData,
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Failed to finalize the uploaded asset ${policy.asset.name}: ${response.status}`)
  }
  return (await response.json()) as UploadAssetFinalizeResponse
}

export const uploadWorkflowArtifactVideo = async ({
  artifact,
  octokit,
  repositoryId,
}: {
  readonly artifact: WorkflowArtifact
  readonly octokit: UploadWorkflowArtifactVideoOctokit
  readonly repositoryId: number
}): Promise<UploadedWorkflowArtifactVideo> => {
  const token = await getToken(octokit)
  const video = await readWorkflowArtifactVideo(octokit, artifact)
  const policy = await requestUploadPolicy({
    contentType: video.contentType,
    fileName: video.fileName,
    repositoryId,
    size: video.content.length,
    token,
  })
  await uploadAssetContent({
    content: video.content,
    contentType: video.contentType,
    fileName: video.fileName,
    policy,
  })
  const uploadedAsset = await finalizeUploadedAsset({
    policy,
    token,
  })
  return {
    name: uploadedAsset.original_name || uploadedAsset.name || video.fileName,
    url: uploadedAsset.href || policy.asset.href,
  }
}
