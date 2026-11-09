export const toNumericGitHubId = (id: number | bigint): number => {
  const numericId = Number(id)
  if (!Number.isSafeInteger(numericId)) {
    throw new Error('GitHub ID exceeds the safe integer range')
  }
  return numericId
}
