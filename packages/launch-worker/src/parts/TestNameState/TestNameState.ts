let testName: string | null = null

export const setTestName = (name: string | null): void => {
  testName = name
}

export const getTestName = (): string | null => {
  return testName
}
