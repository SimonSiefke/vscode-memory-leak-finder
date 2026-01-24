import { fileURLToPath } from 'node:url'

const SOURCE_LOCATION_REGEX = /^(.+):(\d+):(\d+)$/

export const parseSourceLocation = (sourceLocation: string): { url: string; line: number; column: number } | null => {
  if (!sourceLocation) {
    return null
  }
  // Format: ".vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277"
  // Or: "file:/path/to/file.js:917:1277"
  const match = sourceLocation.match(SOURCE_LOCATION_REGEX)
  if (!match) {
    return null
  }
  let path = match[1]
  const line = Number.parseInt(match[2], 10)
  const column = Number.parseInt(match[3], 10)

  // Convert file:// URLs to paths (but not filenames that happen to start with "file:")
  // file:// URLs have at least 3 slashes (file:///) or a path after file:/
  // A filename like "file:name.js" should not be converted
  // Handle both file:// and file:/ formats (file:/ is not standard but may appear)
  if (path.startsWith('file://')) {
    try {
      path = fileURLToPath(path)
    } catch {
      // If conversion fails, keep the original path
    }
  } else if (path.startsWith('file:/') && path.length > 7) {
    // Handle non-standard file:/ format by converting to file:///
    // file:/path -> file:///path
    const standardizedUrl = 'file://' + path.slice(5) // Remove 'file:' and add 'file://'
    try {
      path = fileURLToPath(standardizedUrl)
    } catch {
      // If conversion fails, keep the original path
    }
  }

  return { column, line, url: path }
}
