export const formatStackTrace = (stackTrace: string | string[]): string => {
  let lines: string[]
  if (Array.isArray(stackTrace)) {
    lines = stackTrace
  } else {
    lines = stackTrace.split('\n')
  }

  const formattedLines = lines.map((line) => {
    const relativeLine = line.replace(/(?:[A-Za-z]:)?(?:[\\/][^\\/\s()]+)*[\\/]resources[\\/]+app[\\/]+/g, '')
    const trimmedLine = relativeLine.trim()
    if (trimmedLine.startsWith('at ')) {
      return relativeLine
    }
    if (trimmedLine === '') {
      return relativeLine
    }
    const leadingWhitespace = relativeLine.match(/^\s*/)?.[0] || ''
    return `${leadingWhitespace}at ${trimmedLine}`
  })

  return formattedLines.join('\n')
}
