export const isUnimportantStdoutMessage = (data: string): boolean => {
  return data.startsWith('Found existing install in') && data.endsWith('Skipping download\n')
}
