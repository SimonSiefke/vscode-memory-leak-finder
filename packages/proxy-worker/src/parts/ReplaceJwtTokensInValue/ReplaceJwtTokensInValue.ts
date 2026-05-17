import * as IsExpirationProperty from '../IsExpirationProperty/IsExpirationProperty.ts'
import * as IsJwtToken from '../IsJwtToken/IsJwtToken.ts'
import * as IsUnixTimestamp from '../IsUnixTimestamp/IsUnixTimestamp.ts'
import * as ReplaceJwtToken from '../ReplaceJwtToken/ReplaceJwtToken.ts'

const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000)
}

const getOneYearFromNow = (): number => {
  return getCurrentTimestamp() + 365 * 24 * 60 * 60
}

const isIssuedAtProperty = (key: string): boolean => {
  return /^(iat|issued_at|issuedAt)$/i.test(key)
}

const isSignedCopilotToken = (value: string): boolean => {
  return value.startsWith('tid=') || value.startsWith('Bearer tid=')
}

const isSignedCopilotTokenPayload = (value: unknown): value is { token: string } => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const token = (value as { token?: unknown }).token
  return typeof token === 'string' && isSignedCopilotToken(token)
}

export const replaceJwtTokensInValue = async (value: any, parentKey?: string): Promise<any> => {
  if (typeof value === 'string') {
    if (IsJwtToken.isJwtToken(value)) {
      return await ReplaceJwtToken.replaceJwtToken(value)
    }
    // Check if the string contains a JWT token (e.g., "Bearer eyJ...")
    const jwtMatch = value.match(/(Bearer\s+)?(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/)
    if (jwtMatch) {
      const prefix = jwtMatch[1] || ''
      const token = jwtMatch[2]
      if (IsJwtToken.isJwtToken(token)) {
        return prefix + (await ReplaceJwtToken.replaceJwtToken(token))
      }
    }
    return value
  }

  // Check if this is an expiration timestamp property
  if (parentKey && IsExpirationProperty.isExpirationProperty(parentKey) && IsUnixTimestamp.isUnixTimestamp(value)) {
    return getOneYearFromNow()
  }

  if (parentKey && isIssuedAtProperty(parentKey) && IsUnixTimestamp.isUnixTimestamp(value)) {
    return getCurrentTimestamp()
  }

  if (Array.isArray(value)) {
    return await Promise.all(value.map((item) => replaceJwtTokensInValue(item)))
  }

  if (value !== null && typeof value === 'object') {
    if (isSignedCopilotTokenPayload(value)) {
      return value
    }

    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = await replaceJwtTokensInValue(val, key)
    }
    return result
  }

  return value
}
