interface ResponseLike {
  readonly body: unknown
  readonly statusCode: number
}

export const isExpiredTokenErrorResponse = (response: ResponseLike | undefined): boolean => {
  if (!response || response.statusCode !== 401) {
    return false
  }
  if (typeof response.body !== 'string') {
    return false
  }
  return response.body.toLowerCase().includes('token expired')
}