import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Probot } from 'probot'
import JSZip from 'jszip'
import type { BotEnv } from '../Env/Env.ts'
import { downloadArtifactArchive } from '../DownloadArtifactArchive/DownloadArtifactArchive.ts'

type WorkflowArtifact = {
  readonly archive_download_url: string
  readonly expired?: boolean
  readonly id: number
  readonly name: string
}

type WorkflowArtifactRequestOctokit = {
  readonly auth: (options: { type: 'installation' }) => Promise<unknown | { token: string }>
  readonly request: (route: string, options: Record<string, unknown>) => Promise<{ data: WorkflowArtifact }>
}

type AppOctokit = {
  readonly request: (route: string, options: Record<string, unknown>) => Promise<{ data: { id: number } }>
}

type WorkflowArtifactKind = 'chart' | 'video'

type WorkflowArtifactRequestDetails = {
  readonly artifactId: number | undefined
  readonly chartPath: string | undefined
  readonly owner: string
  readonly repo: string
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
  if (fileName.endsWith('.svg')) {
    return 'image/svg+xml'
  }
  if (fileName.endsWith('.mp4')) {
    return 'video/mp4'
  }
  if (fileName.endsWith('.mov')) {
    return 'video/quicktime'
  }
  return 'video/webm'
}

const sanitizeFileName = (fileName: string): string => {
  return fileName.replaceAll(/[^A-Za-z0-9._-]/g, '-')
}

const getRepositoryInstallationId = async (app: Probot, owner: string, repo: string): Promise<number> => {
  const appOctokit = (await app.auth()) as AppOctokit
  const response = await appOctokit.request('GET /repos/{owner}/{repo}/installation', {
    headers: {
      accept: 'application/vnd.github+json',
    },
    owner,
    repo,
  })
  return response.data.id
}

const getDecodedPath = (pathParts: readonly string[], startIndex: number): string | undefined => {
  if (pathParts.length <= startIndex) {
    return undefined
  }
  return pathParts
    .slice(startIndex)
    .map((part) => decodeURIComponent(part))
    .join('/')
}

const getChartRequestDetails = (requestUrl: URL, env: BotEnv): WorkflowArtifactRequestDetails => {
  const chartPrefix = '/api/workflow-artifacts/chart/'
  if (!requestUrl.pathname.startsWith(chartPrefix)) {
    return {
      artifactId: parsePositiveInteger(requestUrl.searchParams.get('artifact_id')),
      chartPath: undefined,
      owner: env.workflowOwner,
      repo: env.workflowRepo,
    }
  }
  const pathParts = requestUrl.pathname.slice(chartPrefix.length).split('/').filter(Boolean)
  const legacyRunId = parsePositiveInteger(pathParts[0] || null)
  const legacyArtifactId = parsePositiveInteger(pathParts[1] || null)
  if (legacyRunId && legacyArtifactId) {
    return {
      artifactId: legacyArtifactId,
      chartPath: getDecodedPath(pathParts, 2),
      owner: env.workflowOwner,
      repo: env.workflowRepo,
    }
  }
  if (pathParts.length < 5) {
    return {
      artifactId: undefined,
      chartPath: undefined,
      owner: env.workflowOwner,
      repo: env.workflowRepo,
    }
  }
  return {
    artifactId: parsePositiveInteger(pathParts[3] || null),
    chartPath: getDecodedPath(pathParts, 4),
    owner: decodeURIComponent(pathParts[0] || ''),
    repo: decodeURIComponent(pathParts[1] || ''),
  }
}

const getWorkflowArtifactRequestDetails = (
  artifactKind: WorkflowArtifactKind,
  requestUrl: URL,
  env: BotEnv,
): WorkflowArtifactRequestDetails => {
  if (artifactKind === 'chart') {
    return getChartRequestDetails(requestUrl, env)
  }
  return {
    artifactId: parsePositiveInteger(requestUrl.searchParams.get('artifact_id')),
    chartPath: undefined,
    owner: env.workflowOwner,
    repo: env.workflowRepo,
  }
}

const getArtifactRequestConfig = (
  artifactKind: WorkflowArtifactKind,
): {
  readonly defaultFileName: string
  readonly filePattern: RegExp
  readonly nameSuffix: string
  readonly pathname: string
} => {
  if (artifactKind === 'chart') {
    return {
      defaultFileName: 'chart.svg',
      filePattern: /\.svg$/i,
      nameSuffix: '-charts',
      pathname: '/api/workflow-artifacts/chart',
    }
  }
  return {
    defaultFileName: 'video.webm',
    filePattern: /\.(webm|mp4|mov)$/i,
    nameSuffix: '-video',
    pathname: '/api/workflow-artifacts/video',
  }
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined
  }
  return typeof error.status === 'number' ? error.status : undefined
}

const getAssetFile = (zip: JSZip, artifactKind: WorkflowArtifactKind, chartPath: string | undefined, filePattern: RegExp) => {
  return artifactKind === 'chart' && chartPath
    ? zip.file(chartPath)
    : Object.values(zip.files).find((file) => !file.dir && filePattern.test(file.name))
}

const createHandleWorkflowArtifactRequest = (app: Probot, env: BotEnv, artifactKind: WorkflowArtifactKind) => {
  const config = getArtifactRequestConfig(artifactKind)
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    if (request.method !== 'GET') {
      return false
    }
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1')
    const isChartPathRequest = artifactKind === 'chart' && requestUrl.pathname.startsWith('/api/workflow-artifacts/chart/')
    if (requestUrl.pathname !== config.pathname && !isChartPathRequest) {
      return false
    }
    const requestDetails = getWorkflowArtifactRequestDetails(artifactKind, requestUrl, env)
    const { artifactId, chartPath, owner, repo } = requestDetails
    if (!artifactId) {
      writeJson(response, 400, { error: 'artifact_id is required' })
      return true
    }

    try {
      const installationId =
        parsePositiveInteger(requestUrl.searchParams.get('installation_id')) || (await getRepositoryInstallationId(app, owner, repo))
      const octokit = (await app.auth(installationId)) as WorkflowArtifactRequestOctokit
      const artifactResponse = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}', {
        artifact_id: artifactId,
        headers: {
          accept: 'application/vnd.github+json',
        },
        owner,
        repo,
      })
      const artifact = artifactResponse.data
      if (artifact.expired) {
        writeJson(response, 409, { error: 'Artifact has expired' })
        return true
      }
      if (!artifact.name.endsWith(config.nameSuffix)) {
        writeJson(response, 404, { error: `Artifact is not a measure ${artifactKind}` })
        return true
      }

      const archive = await downloadArtifactArchive(octokit, artifact)
      const zip = await JSZip.loadAsync(archive)
      const assetFile = getAssetFile(zip, artifactKind, chartPath, config.filePattern)
      if (!assetFile) {
        writeJson(
          response,
          404,
          artifactKind === 'chart' && chartPath
            ? { error: `Chart file was not found in the artifact archive`, path: chartPath }
            : { error: `No ${artifactKind} file was found in the artifact archive` },
        )
        return true
      }
      const fileName = sanitizeFileName(assetFile.name.split('/').pop() || `${artifact.name}-${config.defaultFileName}`)
      const content = Buffer.from(await assetFile.async('uint8array'))

      response.writeHead(200, {
        'cache-control': 'public, max-age=31536000, immutable',
        'content-disposition': `inline; filename="${fileName}"`,
        'content-length': String(content.length),
        'content-type': getContentType(fileName.toLowerCase()),
        'x-content-type-options': 'nosniff',
      })
      response.end(content)
      return true
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        writeJson(response, 404, { error: 'Artifact not found' })
        return true
      }
      const message = error instanceof Error ? error.message : String(error)
      writeJson(response, 500, { error: message })
      return true
    }
  }
}

export const createHandleWorkflowArtifactVideoRequest = (app: Probot, env: BotEnv) => {
  return createHandleWorkflowArtifactRequest(app, env, 'video')
}

export const createHandleWorkflowArtifactChartRequest = (app: Probot, env: BotEnv) => {
  return createHandleWorkflowArtifactRequest(app, env, 'chart')
}
