const cleanLine = (line) => {
  return line.replace('<anonymous>:', 'dist/injectedCode.js:')
}

export const getDevtoolsProtocolErrorStack = (rawStack) => {
  const lines = rawStack.split('\n')
  const cleanLines = lines.map(cleanLine)
  const stack = cleanLines.join('\n')
  return stack
}
