import chalk from 'chalk'
import * as NodeProcess from 'node:process'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getHandleTestRunningMessage = (file: string, relativeDirName: string, fileName: string, isFirst: boolean): string => {
  const isGithubActions: boolean = Boolean(NodeProcess.env.GITHUB_ACTIONS)
  if (isGithubActions) {
    return `::group::${fileName}\n`
  }
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const prefix: string = isFirst ? '\n' : '\n'
  return `${prefix}${TestPrefix.Runs} ${messageRelativeDirName}${messageFileName}\n`
}
