import type { IncomingMessage, ServerResponse } from 'node:http'
import type { BotEnv } from '../Env/Env.ts'
import {
  allMockDataDownloadPath,
  allMockDataSnapshotUnavailableMessage,
  getMissingR2Config,
  hasAnyR2Config,
  readUserDataSnapshotMetadata,
  readUserDataSnapshotZip,
  userDataSnapshotUnavailableMessage,
  userDataDownloadPath,
} from '../UserDataSnapshot/UserDataSnapshot.ts'
import { getR2GetObjectRequest } from '../GetR2GetObjectRequest/GetR2GetObjectRequest.ts'

type SnapshotRouteConfig = {
  readonly getR2ObjectKey: (env: BotEnv) => string
  readonly path: string
  readonly unavailableMessage: string
  readonly usesStoredUserData: boolean
}

const snapshotRouteConfigs: readonly SnapshotRouteConfig[] = [
  {
    getR2ObjectKey: (env) => env.allMockDataR2ObjectKey,
    path: allMockDataDownloadPath,
    unavailableMessage: allMockDataSnapshotUnavailableMessage,
    usesStoredUserData: false,
  },
  {
    getR2ObjectKey: (env) => env.userDataR2ObjectKey,
    path: userDataDownloadPath,
    unavailableMessage: userDataSnapshotUnavailableMessage,
    usesStoredUserData: true,
  },
]

const getBearerToken = (request: IncomingMessage): string => {
  const authorization = request.headers.authorization
  if (!authorization?.startsWith('Bearer ')) {
    return ''
  }
  return authorization.slice('Bearer '.length)
}

const writeJson = (response: ServerResponse, statusCode: number, body: unknown): void => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

const getSnapshotRouteConfig = (path: string): SnapshotRouteConfig | undefined => {
  return snapshotRouteConfigs.find((item) => item.path === path)
}

const readSnapshotZipFromR2 = async (env: BotEnv, key: string): Promise<Buffer | undefined> => {
  const { headers, url } = getR2GetObjectRequest({
    accessKeyId: env.userDataR2AccessKeyId,
    accountId: env.userDataR2AccountId,
    bucket: env.userDataR2Bucket,
    key,
    secretAccessKey: env.userDataR2SecretAccessKey,
  })
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) {
    return undefined
  }
  if (!response.ok) {
    throw new Error(`Failed to download private R2 snapshot: ${response.status} ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

export const createHandleUserDataDownloadRequest = (env: BotEnv) => {
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    if (request.method !== 'GET') {
      return false
    }
    const path = request.url?.split('?')[0] ?? ''
    const routeConfig = getSnapshotRouteConfig(path)
    if (!routeConfig) {
      return false
    }
    if (hasAnyR2Config(env)) {
      const missing = getMissingR2Config(env)
      if (missing.length > 0) {
        writeJson(response, 503, { error: `Incomplete R2 snapshot configuration. Missing: ${missing.join(', ')}` })
        return true
      }
      if (!env.userDataUploadToken) {
        writeJson(response, 503, { error: 'BOT_USER_DATA_UPLOAD_TOKEN must be configured for private R2 snapshots' })
        return true
      }
      const downloadToken = getBearerToken(request)
      if (!downloadToken || downloadToken !== env.userDataUploadToken) {
        writeJson(response, 401, { error: 'Unauthorized' })
        return true
      }
      try {
        const zipContent = await readSnapshotZipFromR2(env, routeConfig.getR2ObjectKey(env))
        if (!zipContent) {
          writeJson(response, 404, { error: routeConfig.unavailableMessage })
          return true
        }
        response.writeHead(200, {
          'content-length': String(zipContent.length),
          'content-type': 'application/zip',
        })
        response.end(zipContent)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        writeJson(response, 500, { error: message })
        return true
      }
    }
    if (!routeConfig.usesStoredUserData) {
      writeJson(response, 404, { error: routeConfig.unavailableMessage })
      return true
    }
    const [metadata, zipContent] = await Promise.all([
      readUserDataSnapshotMetadata(env.userDataStoragePath),
      readUserDataSnapshotZip(env.userDataStoragePath),
    ])
    if (!metadata || !zipContent) {
      writeJson(response, 404, { error: routeConfig.unavailableMessage })
      return true
    }
    const downloadToken = getBearerToken(request)
    const isSnapshotToken = downloadToken === metadata.downloadToken
    const isSharedUploadToken = !!env.userDataUploadToken && downloadToken === env.userDataUploadToken
    if (!downloadToken || (!isSnapshotToken && !isSharedUploadToken)) {
      writeJson(response, 401, { error: 'Unauthorized' })
      return true
    }
    response.writeHead(200, {
      'content-length': String(zipContent.length),
      'content-type': 'application/zip',
    })
    response.end(zipContent)
    return true
  }
}
