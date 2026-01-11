import jwt from 'jsonwebtoken'

export const replaceJwtToken = (token: string): string => {
  try {
    // Decode the JWT without verification to get the payload
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string' || !decoded.payload) {
      return token // Return original if decoding fails
    }

    const payload = decoded.payload as Record<string, any>

    // Update expiration to one year from now
    const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
    const newPayload = {
      ...payload,
      exp: oneYearFromNow,
      iat: Math.floor(Date.now() / 1000), // Update issued at time
    }

    // Generate new JWT with algorithm "none" (no signature)
    const newToken = jwt.sign(newPayload, '', {
      algorithm: 'none',
    })

    return newToken
  } catch (error) {
    // If anything fails, return the original token
    console.warn(`Failed to replace JWT token: ${error}`)
    return token
  }
}
