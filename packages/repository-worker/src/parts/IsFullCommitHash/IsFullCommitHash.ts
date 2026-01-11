const RE_HASH = /^[a-f\d]{40}$/i

/**
 * Checks if a string is a full 40-character commit hash
 */
export const isFullCommitHash = (commitRef: string): boolean => {
  return RE_HASH.test(commitRef)
}
