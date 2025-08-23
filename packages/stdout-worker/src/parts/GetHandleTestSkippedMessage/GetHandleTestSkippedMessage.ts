import chalk from 'chalk'
import * as NodeProcess from 'node:process'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.ts'

const SKIP_TEXT: string = ' SKIP '

const SKIP: string = chalk.reset.inverse.bold.yellow(SKIP_TEXT)

const formatDuration = (duration: number): string => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}

export const getHandleTestSkippedMessage = (file: string, relativeDirName: string, fileName: string, duration: number): string => {
  const isGithubActions: boolean = Boolean(NodeProcess.env.GITHUB_ACTIONS)
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const messageDuration: string = formatDuration(duration)
  const core: string = `${SKIP} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
  if (isGithubActions) {
    return core + '::endgroup::\n'
  }
  return core
}
