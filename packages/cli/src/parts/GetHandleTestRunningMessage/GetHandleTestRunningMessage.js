import chalk from 'chalk'
import * as TestPrefix from '../TestPrefix/TestPrefix.js'

export const getHandleTestRunningMessage = (file, relativeDirName, fileName, isFirst) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const prefix = isFirst ? '' : '\n'
  return `${prefix}${TestPrefix.Runs} ${messageRelativeDirName}${messageFileName}\n`
}
