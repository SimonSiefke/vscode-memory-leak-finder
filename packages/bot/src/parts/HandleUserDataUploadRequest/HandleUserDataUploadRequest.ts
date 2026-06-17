import type { IncomingMessage, ServerResponse } from 'node:http'
import type { BotEnv } from '../Env/Env.ts'
import { getUserDataDownloadUrl, saveUserDataSnapshot } from '../UserDataSnapshot/UserDataSnapshot.ts'

const readRequestBody = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

const getBearerToken = (request: IncomingMessage): string => {
  const authorization = request.headers.authorization
  if (!authorization?.startsWith('Bearer ')) {
    return ''
  }
  return authorization.slice('Bearer '.length)
}

const getBaseUrl = (env: BotEnv, request: IncomingMessage): string => {
  if (env.publicBaseUrl) {
    return env.publicBaseUrl
  }
  const protocol = request.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
  const host = request.headers.host || '127.0.0.1'
  return `${protocol}://${host}`
}

const writeJson = (response: ServerResponse, statusCode: number, body: unknown): void => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

export const createHandleUserDataUploadRequest = (env: BotEnv) => {
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    if (request.method !== 'POST') {
      return false
    }
    const path = request.url?.split('?')[0] ?? ''
    if (path !== '/api/user-data/upload') {
      return false
    }
    if (!env.userDataUploadToken) {
      writeJson(response, 503, { error: 'BOT_USER_DATA_UPLOAD_TOKEN is not configured' })
      return true
    }
    const uploadToken = getBearerToken(request)
    if (!uploadToken || uploadToken !== env.userDataUploadToken) {
      writeJson(response, 401, { error: 'Unauthorized' })
      return true
    }
    const body = await readRequestBody(request)
    if (body.length === 0) {
      writeJson(response, 400, { error: 'Expected a zip file request body' })
      return true
    }
    try {
      await saveUserDataSnapshot(env.userDataStoragePath, body, 'shared-upload-token')
      writeJson(response, 201, {
        downloadUserDataZipFileUrl: getUserDataDownloadUrl(getBaseUrl(env, request)),
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      writeJson(response, 400, { error: message })
      return true
    }
  }
}
