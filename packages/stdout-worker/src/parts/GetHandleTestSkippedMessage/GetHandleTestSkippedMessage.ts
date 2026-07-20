import chalk from 'chalk'

const SKIP_TEXT: string = ' SKIP '

const SKIP: string = chalk.reset.inverse.bold.yellow(SKIP_TEXT)

export const getHandleTestSkippedMessage = (file: string, relativeDirName: string, fileName: string, duration: number): string => {
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  return `${SKIP} ${messageRelativeDirName}${messageFileName}\n`
}
