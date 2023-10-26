import chalk from 'chalk'

const RUNNING_TEXT = ' RUNS '
const RUNNING = chalk.reset.inverse.yellow.bold(RUNNING_TEXT)

export const getHandleTestRunningMessage = (file, relativeDirName, fileName, isFirst) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const prefix = isFirst ? '' : '\n'
  return `${prefix}${RUNNING} ${messageRelativeDirName}${messageFileName}\n`
}
