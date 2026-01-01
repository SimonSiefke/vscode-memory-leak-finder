import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'

export const isIgnoredProcessKillError = (error: unknown): boolean => {
  if (!error) {
    return false
  }
  if (typeof error !== 'object') {
    return false
  }
  if (!('code' in error)) {
    return false
  }
  const errorCode = (error as { code?: string }).code
  if (errorCode === ErrorCodes.ENOENT || errorCode === ErrorCodes.ESRCH || errorCode === ErrorCodes.EPERM) {
    return true
  }
  return false
}
