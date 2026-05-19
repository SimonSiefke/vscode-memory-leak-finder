import type { IncomingMessage, ServerResponse } from 'node:http'
import type { BotEnv } from '../Env/Env.ts'
import {
  readUserDataSnapshotMetadata,
  readUserDataSnapshotZip,
  userDataSnapshotUnavailableMessage,
} from '../UserDataSnapshot/UserDataSnapshot.ts'

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

export const createHandleUserDataDownloadRequest = (env: BotEnv) => {
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    if (request.method !== 'GET') {
      return false
    }
    const path = request.url?.split('?')[0] ?? ''
    if (path !== '/api/user-data/download') {
      return false
    }
    const [metadata, zipContent] = await Promise.all([
      readUserDataSnapshotMetadata(env.userDataStoragePath),
      readUserDataSnapshotZip(env.userDataStoragePath),
    ])
    if (!metadata || !zipContent) {
      writeJson(response, 404, { error: userDataSnapshotUnavailableMessage })
      return true
    }
    const downloadToken = getBearerToken(request)
    if (!downloadToken || downloadToken !== metadata.downloadToken) {
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
