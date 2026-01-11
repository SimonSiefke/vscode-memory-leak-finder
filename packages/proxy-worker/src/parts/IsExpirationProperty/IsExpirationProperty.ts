// Patterns for expiration-related property names
const EXPIRATION_PATTERNS = [
  /^expires?$/i,
  /^expires?_at$/i,
  /^expiresAt$/i,
  /^expiry$/i,
  /^expiry_at$/i,
  /^expiryAt$/i,
  /^exp$/i,
  /^expiration$/i,
  /^expiration_at$/i,
  /^expirationAt$/i,
  /^token_expires?$/i,
  /^token_expires?_at$/i,
  /^access_token_expires?$/i,
  /^access_token_expires?_at$/i,
  /^refresh_token_expires?$/i,
  /^refresh_token_expires?_at$/i,
]

export const isExpirationProperty = (key: string): boolean => {
  return EXPIRATION_PATTERNS.some((pattern) => pattern.test(key))
}
