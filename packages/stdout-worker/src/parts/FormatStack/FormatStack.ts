import { chalk } from '../Chalk/Chalk.ts'

const RE_STACK_PATH_1: RegExp = /(^\s*at .*?\(?)([^()]+)(:\d+:\d+\)?.*$)/
const RE_STACK_PATH_2: RegExp = /(^\s*at .*?)([^()]+)(:\d+$)/

const stackTraceColor = (string: string): string => {
  return chalk.dim(string)
}

const formatStackLine = (line: string, relativeFilePath: string): string => {
  const stackMatch1: RegExpMatchArray | null = line.match(RE_STACK_PATH_1)
  if (stackMatch1) {
    let filePath: string = stackMatch1[2]
    if (filePath === relativeFilePath) {
      filePath = chalk.reset.cyan(filePath)
    }
    return '   ' + stackTraceColor(stackMatch1[1]) + filePath + stackTraceColor(stackMatch1[3])
  }
  const stackMatch2: RegExpMatchArray | null = line.match(RE_STACK_PATH_2)
  if (stackMatch2) {
    const filePath: string = stackMatch2[2]
    return '   ' + stackTraceColor(stackMatch2[1]) + filePath + stackTraceColor(stackMatch2[3])
  }
  return line
}

export const formatStack = (stack: string, relativeFilePath: string): string => {
  const formattedLines: string[] = []
  const lines: string[] = stack.split('\n')
  for (const line of lines) {
    formattedLines.push(formatStackLine(line, relativeFilePath))
  }
  return formattedLines.join('\n')
}
