import type { IncomingMessage, ServerResponse } from 'node:http'
import JSZip from 'jszip'
import type { Probot } from 'probot'
import { downloadArtifactArchive } from '../DownloadArtifactArchive/DownloadArtifactArchive.ts'
import type { BotEnv } from '../Env/Env.ts'

type WorkflowArtifact = {
  readonly archive_download_url: string
  readonly expired?: boolean
  readonly id: number
  readonly name: string
}

const writeJson = (response: ServerResponse, statusCode: number, body: unknown): void => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

const parsePositiveInteger = (value: string | null): number | undefined => {
  if (!value) {
    return undefined
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }
  return parsed
}

const getContentType = (fileName: string): string => {
  if (fileName.endsWith('.mp4')) {
    return 'video/mp4'
  }
  if (fileName.endsWith('.mov')) {
    return 'video/quicktime'
  }
  return 'video/webm'
}

const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^A-Za-z0-9._-]/g, '-')
}

export const createHandleWorkflowArtifactVideoRequest = (app: Probot, env: BotEnv) => {
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    if (request.method !== 'GET') {
      return false
    }
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1')
    if (requestUrl.pathname !== '/api/workflow-artifacts/video') {
      return false
    }
    const artifactId = parsePositiveInteger(requestUrl.searchParams.get('artifact_id'))
    const installationId = parsePositiveInteger(requestUrl.searchParams.get('installation_id'))
    if (!artifactId || !installationId) {
      writeJson(response, 400, { error: 'artifact_id and installation_id query parameters are required' })
      return true
    }

    try {
      const octokit = await app.auth(installationId)
      const artifactResponse = (await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}', {
        owner: env.workflowOwner,
        repo: env.workflowRepo,
        artifact_id: artifactId,
        headers: {
          accept: 'application/vnd.github+json',
        },
      })) as { data: WorkflowArtifact }
      const artifact = artifactResponse.data
      if (artifact.expired) {
        writeJson(response, 410, { error: 'Artifact has expired' })
        return true
      }
      if (!artifact.name.endsWith('-video')) {
        writeJson(response, 404, { error: 'Artifact is not a measure video' })
        return true
      }

      const archive = await downloadArtifactArchive(octokit, artifact)
      const zip = await JSZip.loadAsync(archive)
      const videoFile = Object.values(zip.files).find((file) => !file.dir && /\.(webm|mp4|mov)$/i.test(file.name))
      if (!videoFile) {
        writeJson(response, 404, { error: 'No video file was found in the artifact archive' })
        return true
      }
      const fileName = sanitizeFileName(videoFile.name.split('/').pop() || `${artifact.name}.webm`)
      const content = Buffer.from(await videoFile.async('uint8array'))

      response.writeHead(200, {
        'cache-control': 'public, max-age=3600',
        'content-disposition': `inline; filename="${fileName}"`,
        'content-length': String(content.length),
        'content-type': getContentType(fileName.toLowerCase()),
        'x-content-type-options': 'nosniff',
      })
      response.end(content)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      writeJson(response, 500, { error: message })
      return true
    }
  }
}
