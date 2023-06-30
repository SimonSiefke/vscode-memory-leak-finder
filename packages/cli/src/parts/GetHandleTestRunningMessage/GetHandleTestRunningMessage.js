import chalk from 'chalk'

const RUNNING_TEXT = ' RUNS '
const RUNNING = chalk.reset.inverse.yellow.bold(RUNNING_TEXT)

export const getHandleTestRunningMessage = (file, relativeDirName, fileName) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  return `\n${RUNNING} ${messageRelativeDirName}${messageFileName}\n`
}
