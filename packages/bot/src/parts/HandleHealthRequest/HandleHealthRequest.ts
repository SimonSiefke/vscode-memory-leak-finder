import type { IncomingMessage, ServerResponse } from 'node:http'

const body = JSON.stringify({ ok: true })

export const handleHealthRequest = (request: IncomingMessage, response: ServerResponse): boolean => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }
  const path = request.url?.split('?')[0] ?? ''
  if (path !== '/health') {
    return false
  }
  response.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(request.method === 'HEAD' ? undefined : body)
  return true
}
