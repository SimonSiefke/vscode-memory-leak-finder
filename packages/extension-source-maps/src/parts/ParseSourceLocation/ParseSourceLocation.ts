const SOURCE_LOCATION_REGEX = /^(.+):(\d+):(\d+)$/

export const parseSourceLocation = (sourceLocation: string): { url: string; line: number; column: number } | null => {
  if (!sourceLocation) {
    return null
  }
  // Format: ".vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277"
  const match = sourceLocation.match(SOURCE_LOCATION_REGEX)
  if (!match) {
    return null
  }
  const path = match[1]
  const line = Number.parseInt(match[2], 10)
  const column = Number.parseInt(match[3], 10)
  return { url: path, line, column }
}
