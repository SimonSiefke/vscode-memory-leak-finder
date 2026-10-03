export const runMemoryCityComparisons = async (
  compareRenderer: () => Promise<unknown>,
  compareExtensionHost: () => Promise<unknown>,
): Promise<void> => {
  let failed = false
  let firstError: unknown
  try {
    await compareRenderer()
  } catch (error) {
    failed = true
    firstError = error
  }
  try {
    await compareExtensionHost()
  } catch (error) {
    if (!failed) {
      firstError = error
    }
    failed = true
  }
  if (failed) {
    throw firstError
  }
}
