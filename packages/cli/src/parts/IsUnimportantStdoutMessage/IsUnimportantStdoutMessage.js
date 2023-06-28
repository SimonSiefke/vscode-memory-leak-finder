export const isUnimportantStdoutMessage = (data) => {
  return data.startsWith('Found existing install in') && data.endsWith('Skipping download\n')
}
