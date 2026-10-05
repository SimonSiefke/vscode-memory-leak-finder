interface ResponseLike {
  readonly body: unknown
  readonly statusCode: number
}

const authErrorStatusCodes = new Set([400, 401])
const authErrorMarkers = ['token expired', 'invalid token', 'cannot validate hmac', 'cannot decode hmac', 'authentication failed']

export const isExpiredTokenErrorResponse = (response: ResponseLike | undefined): boolean => {
  if (!response || !authErrorStatusCodes.has(response.statusCode)) {
    return false
  }
  if (typeof response.body !== 'string') {
    return false
  }
  const normalizedBody = response.body.toLowerCase()
  return authErrorMarkers.some((marker) => normalizedBody.includes(marker))
}
