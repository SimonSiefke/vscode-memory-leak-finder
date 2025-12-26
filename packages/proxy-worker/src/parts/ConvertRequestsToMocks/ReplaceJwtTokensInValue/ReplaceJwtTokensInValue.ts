<<<<<<< HEAD
import * as IsJwtToken from '../IsJwtToken/IsJwtToken.ts'
import * as ReplaceJwtToken from '../ReplaceJwtToken/ReplaceJwtToken.ts'
import * as IsExpirationProperty from '../IsExpirationProperty/IsExpirationProperty.ts'
import * as IsUnixTimestamp from '../IsUnixTimestamp/IsUnixTimestamp.ts'
=======
import * as IsExpirationProperty from '../IsExpirationProperty/IsExpirationProperty.ts'
import * as IsJwtToken from '../IsJwtToken/IsJwtToken.ts'
import * as IsUnixTimestamp from '../IsUnixTimestamp/IsUnixTimestamp.ts'
import * as ReplaceJwtToken from '../ReplaceJwtToken/ReplaceJwtToken.ts'
>>>>>>> origin/main

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
    const oneMonthFromNow = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    return oneMonthFromNow
  }

  if (Array.isArray(value)) {
    return await Promise.all(value.map((item) => replaceJwtTokensInValue(item)))
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = await replaceJwtTokensInValue(val, key)
    }
    return result
  }

  return value
}
