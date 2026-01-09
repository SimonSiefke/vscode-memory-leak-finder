let currentTestName: string | null = null

export const setCurrentTestName = (testName: string | null): void => {
  currentTestName = testName
}

export const getCurrentTestName = (): string | null => {
  return currentTestName
}
