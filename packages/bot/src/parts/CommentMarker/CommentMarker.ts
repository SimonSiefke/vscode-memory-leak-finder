type CommentMarkerData = {
  readonly requestId: string
  readonly sourceRepository: string
  readonly statusCommentId: number
}

const prefix = '<!-- vscode-memory-leak-finder:'
const suffix = ' -->'

export const createCommentMarker = (data: CommentMarkerData): string => {
  const encoded = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url')
  return `${prefix}${encoded}${suffix}`
}

export const parseCommentMarker = (body: string): CommentMarkerData | undefined => {
  const startIndex = body.indexOf(prefix)
  if (startIndex === -1) {
    return undefined
  }
  const endIndex = body.indexOf(suffix, startIndex)
  if (endIndex === -1) {
    return undefined
  }
  const encoded = body.slice(startIndex + prefix.length, endIndex)
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return undefined
  }
}
