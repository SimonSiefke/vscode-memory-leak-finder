/**
 * Checks if a string is a full 40-character commit hash
 * @param {string} commitRef - The commit reference to check
 * @returns {boolean} True if it's a full commit hash, false otherwise
 */
export const isFullCommitHash = (commitRef) => {
  return /^[a-f0-9]{40}$/i.test(commitRef)
}