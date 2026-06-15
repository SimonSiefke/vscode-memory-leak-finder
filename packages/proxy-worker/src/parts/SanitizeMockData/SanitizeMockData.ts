const mockTrackingId = '00000000-0000-4000-8000-000000000001'
const mockTelemetryIds: Record<string, string> = {
  activityid: '00000000-0000-4000-8000-000000000010',
  'x-tfs-session': '00000000-0000-4000-8000-000000000011',
  'x-vss-e2eid': '00000000-0000-4000-8000-000000000012',
  'x-tfs-processid': '00000000-0000-4000-8000-000000000013',
  'request-context': 'appId=cid-v1:00000000-0000-4000-8000-000000000014',
  'x-vss-senderdeploymentid': '00000000-0000-4000-8000-000000000015',
}

const mockIssuedAt = 1_700_000_000
const mockExpiration = 4_102_444_800
const mockIpAddress = '203.0.113.10'
const mockAsn = 'AS65500:mock'

const isSignedCopilotToken = (value: string): boolean => {
  return value.startsWith('tid=') || value.startsWith('Bearer tid=')
}

const replaceIpAddresses = (value: string): string => {
  return value.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, mockIpAddress)
}

const sanitizeSignedCopilotToken = (value: string): string => {
  const prefix = value.startsWith('Bearer ') ? 'Bearer ' : ''
  const token = prefix ? value.slice('Bearer '.length) : value
  if (!token.startsWith('tid=')) {
    return replaceIpAddresses(value)
  }
  const sanitizedToken = token
    .split(';')
    .map((part) => {
      if (part.startsWith('tid=')) {
        return `tid=${mockTrackingId}`
      }
      if (part.startsWith('exp=')) {
        return `exp=${mockExpiration}`
      }
      if (part.startsWith('iat=')) {
        return `iat=${mockIssuedAt}`
      }
      if (part.startsWith('ip=')) {
        return `ip=${mockIpAddress}`
      }
      if (part.startsWith('asn=')) {
        return `asn=${mockAsn}`
      }
      return part
    })
    .join(';')
  return `${prefix}${sanitizedToken}`
}

const sanitizeMockValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    if (isSignedCopilotToken(value)) {
      return sanitizeSignedCopilotToken(value)
    }
    return replaceIpAddresses(value)
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMockValue)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const objectValue = value as Record<string, unknown>
  if (typeof objectValue.token === 'string' && isSignedCopilotToken(objectValue.token)) {
    const sanitizedToken = sanitizeSignedCopilotToken(objectValue.token)
    const sanitizedObject: Record<string, unknown> = {
      ...objectValue,
      token: sanitizedToken,
    }
    if (typeof objectValue.tracking_id === 'string') {
      sanitizedObject.tracking_id = mockTrackingId
    }
    if (typeof objectValue.trackingId === 'string') {
      sanitizedObject.trackingId = mockTrackingId
    }
    if (typeof objectValue.expires_at === 'number') {
      sanitizedObject.expires_at = mockExpiration
    }
    if (typeof objectValue.expiresAt === 'number') {
      sanitizedObject.expiresAt = mockExpiration
    }
    if (typeof objectValue.iat === 'number') {
      sanitizedObject.iat = mockIssuedAt
    }
    return sanitizedObject
  }

  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(objectValue)) {
    result[key] = sanitizeMockValue(item)
  }
  return result
}

export const sanitizeMockHeaders = (headers: Record<string, string | string[]>): Record<string, string | string[]> => {
  const result: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase()
    if (normalizedKey in mockTelemetryIds) {
      result[key] = mockTelemetryIds[normalizedKey]
      continue
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === 'string' ? replaceIpAddresses(item) : item))
      continue
    }
    result[key] = typeof value === 'string' ? replaceIpAddresses(value) : value
  }
  return result
}

export const sanitizeMockBody = (body: unknown): unknown => {
  return sanitizeMockValue(body)
}
