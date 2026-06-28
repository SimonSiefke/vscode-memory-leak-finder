export const renderInvalidCommandComment = (message: string): string => {
  return `Unable to start a measure run.

${message}

Example:

\`@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --inspect-extensions\``
}
