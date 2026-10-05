let testFolderName = ''

export const getTestFolderName = (): string => {
  return testFolderName
}

export const setTestFolderName = (value: string | undefined): void => {
  testFolderName = value || ''
}
