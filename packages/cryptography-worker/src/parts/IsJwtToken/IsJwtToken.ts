// JWT pattern: three base64url-encoded parts separated by dots
const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export const isJwtToken = (value: string): boolean => {
  if (typeof value !== 'string') {
    return false
  }
  // Check if it matches JWT pattern (three parts separated by dots)
  const parts = value.split('.')
  if (parts.length !== 3) {
    return false
  }
  // Check if it matches the pattern (starts with eyJ which is base64url for {" header)
  return JWT_PATTERN.test(value)
}
