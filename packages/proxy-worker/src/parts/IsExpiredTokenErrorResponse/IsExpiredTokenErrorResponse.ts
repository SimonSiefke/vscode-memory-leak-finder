interface ResponseLike {
  readonly body: unknown
  readonly statusCode: number
}

const authErrorMarkers = ['token expired', 'invalid token', 'cannot validate hmac', 'authentication failed']

export const isExpiredTokenErrorResponse = (response: ResponseLike | undefined): boolean => {
  if (!response || response.statusCode !== 401) {
    return false
  }
  if (typeof response.body !== 'string') {
    return false
  }
  const normalizedBody = response.body.toLowerCase()
  return authErrorMarkers.some((marker) => normalizedBody.includes(marker))
}
