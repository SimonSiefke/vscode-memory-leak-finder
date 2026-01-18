export const formatStackTrace = (stackTrace: string | string[]): string => {
  let lines: string[]
  if (Array.isArray(stackTrace)) {
    lines = stackTrace
  } else {
    lines = stackTrace.split('\n')
  }

  const formattedLines = lines.map((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('at ')) {
      return line
    }
    if (trimmedLine === '') {
      return line
    }
    const leadingWhitespace = line.match(/^\s*/)?.[0] || ''
    return `${leadingWhitespace}at ${trimmedLine}`
  })

  return formattedLines.join('\n')
}
