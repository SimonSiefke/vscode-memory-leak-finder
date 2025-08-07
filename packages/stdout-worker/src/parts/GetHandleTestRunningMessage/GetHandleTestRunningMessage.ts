import chalk from 'chalk'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getHandleTestRunningMessage = (file, relativeDirName, fileName, isFirst) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const prefix = isFirst ? '\n' : '\n'
  return `${prefix}${TestPrefix.Runs} ${messageRelativeDirName}${messageFileName}\n`
}
