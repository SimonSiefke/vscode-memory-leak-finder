import chalk from 'chalk'

const RE_STACK_PATH_1 = /(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/
const RE_STACK_PATH_2 = /(^\s*at .*?)([^()]+)(:\d+$)/

const stackTraceColor = (string) => {
  return chalk.dim(string)
}

const formatStackLine = (line, relativeFilePath) => {
  const stackMatch1 = line.match(RE_STACK_PATH_1)
  if (stackMatch1) {
    let filePath = stackMatch1[2]
    if (filePath === relativeFilePath) {
      filePath = chalk.reset.cyan(filePath)
    }
    return '   ' + stackTraceColor(stackMatch1[1]) + filePath + stackTraceColor(stackMatch1[3])
  }
  const stackMatch2 = line.match(RE_STACK_PATH_2)
  if (stackMatch2) {
    let filePath = stackMatch2[2]
    return '   ' + stackTraceColor(stackMatch2[1]) + filePath + stackTraceColor(stackMatch2[3])
  }
  return line
}

export const formatStack = (stack, relativeFilePath) => {
  const formattedLines = []
  const lines = stack.split('\n')
  for (const line of lines) {
    formattedLines.push(formatStackLine(line, relativeFilePath))
  }
  return formattedLines.join('\n')
}
