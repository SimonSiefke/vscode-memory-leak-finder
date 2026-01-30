/**
 * Check if an error is an ENOENT error (file/directory not found).
 * Useful for handling cases where processes are cleaned up/killed between enumeration and access.
 */
export const isEnoentError = (error: unknown): boolean => {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'
}
