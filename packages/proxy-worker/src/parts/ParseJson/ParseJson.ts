export const parseJsonIfApplicable = (body: string | number[], contentType: string | string[] | undefined): string | object => {
  // Handle case where body is an array of numbers (bytes) instead of a string
  // This can happen when data is serialized through RPC and Buffers get converted to arrays
  let bodyString: string
  if (Array.isArray(body)) {
    bodyString = new TextDecoder().decode(new Uint8Array(body))
  } else {
    bodyString = body
  }

  if (!contentType) {
    return bodyString
  }

  const contentTypeStr = Array.isArray(contentType) ? contentType[0] : contentType
  const normalizedContentType = contentTypeStr.toLowerCase().trim()

  // Check if content type is JSON
  if (normalizedContentType.includes('application/json') || normalizedContentType.includes('text/json')) {
    try {
      return JSON.parse(bodyString)
    } catch {
      // If parsing fails, return as string
      return bodyString
    }
  }

  return bodyString
}
