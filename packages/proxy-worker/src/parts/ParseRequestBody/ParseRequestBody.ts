export const parseRequestBody = (
  headers: Record<string, string | string[] | undefined>,
  requestBody: Buffer | undefined,
): string | object | undefined => {
  if (!requestBody || requestBody.length === 0) {
    return undefined
  }

  const contentTypeHeader = headers['content-type'] || headers['Content-Type'] || ''
  const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] || '' : contentTypeHeader
  const contentTypeLower = contentType.toLowerCase()

  let parsedBody: string | object = requestBody.toString('utf8')

  if (contentTypeLower.includes('application/json')) {
    try {
      parsedBody = JSON.parse(parsedBody)
    } catch {
      return parsedBody
    }
    return parsedBody
  }

  if (contentTypeLower.includes('application/x-www-form-urlencoded')) {
    try {
      const formData: Record<string, string> = {}
      const params = new URLSearchParams(parsedBody)
      for (const [key, value] of params) {
        formData[key] = value
      }
      return formData
    } catch {
      return parsedBody
    }
  }

  return parsedBody
}
