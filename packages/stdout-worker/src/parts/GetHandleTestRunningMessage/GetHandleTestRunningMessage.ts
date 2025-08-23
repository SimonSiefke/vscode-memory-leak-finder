import { chalk } from '../Chalk/Chalk.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getHandleTestRunningMessage = (file: string, relativeDirName: string, fileName: string, isFirst: boolean): string => {
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const prefix: string = isFirst ? '\n' : '\n'
  return `${prefix}${TestPrefix.Runs} ${messageRelativeDirName}${messageFileName}\n`
}
