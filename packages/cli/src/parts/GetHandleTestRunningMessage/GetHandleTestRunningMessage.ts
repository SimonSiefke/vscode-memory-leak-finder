import chalk from 'chalk'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getHandleTestRunningMessage = async (file, relativeDirName, fileName, isFirst): Promise<string> => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const prefix = isFirst ? '\n' : '\n'
  return `${prefix}${TestPrefix.Runs} ${messageRelativeDirName}${messageFileName}\n`
}
