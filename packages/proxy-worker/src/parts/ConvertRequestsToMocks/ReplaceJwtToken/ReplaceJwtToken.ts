import { createRequire } from 'module'
import * as GetEcdsaKeyPair from '../GetEcdsaKeyPair/GetEcdsaKeyPair.ts'
import * as GetRsaKeyPair from '../GetRsaKeyPair/GetRsaKeyPair.ts'

const require = createRequire(import.meta.url)
const jwt = require('jsonwebtoken')

export const replaceJwtToken = (token: string): string => {
  try {
    // Decode the JWT without verification to get the payload
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string' || !decoded.payload) {
      return token // Return original if decoding fails
    }

    const payload = decoded.payload as Record<string, any>
    const {header} = decoded

    // Update expiration to one month from now
    const oneMonthFromNow = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    const newPayload = {
      ...payload,
      exp: oneMonthFromNow,
      iat: Math.floor(Date.now() / 1000), // Update issued at time
    }

    // Generate new JWT with the same algorithm (default to HS256 if not specified)
    const algorithm = (header.alg || 'HS256') as jwt.Algorithm

    // Determine if algorithm is symmetric or asymmetric
    const symmetricAlgorithms = ['HS256', 'HS384', 'HS512']
    const isSymmetric = symmetricAlgorithms.includes(algorithm)

    let newToken: string

    if (isSymmetric) {
      // Use secret for symmetric algorithms
      const secret = 'mock-secret-key-for-jwt-generation' // Fixed secret for mock tokens
      newToken = jwt.sign(newPayload, secret, {
        algorithm,
      })
    } else {
      // Use key pair for asymmetric algorithms (RS256, RS384, RS512, ES256, ES384, ES512)
      if (algorithm.startsWith('ES')) {
        // ECDSA algorithms
        const { privateKey } = GetEcdsaKeyPair.getEcdsaKeyPair(algorithm)
        newToken = jwt.sign(newPayload, privateKey, {
          algorithm,
        })
      } else if (algorithm.startsWith('RS') || algorithm.startsWith('PS')) {
        // RSA algorithms - use cached key pair
        const { privateKey } = GetRsaKeyPair.getRsaKeyPair()
        newToken = jwt.sign(newPayload, privateKey, {
          algorithm,
        })
      } else {
        // Fallback to HS256 for unknown algorithms
        const secret = 'mock-secret-key-for-jwt-generation'
        newToken = jwt.sign(newPayload, secret, {
          algorithm: 'HS256',
        })
      }
    }

    return newToken
  } catch (error) {
    // If anything fails, return the original token
    console.warn(`Failed to replace JWT token: ${error}`)
    return token
  }
}
