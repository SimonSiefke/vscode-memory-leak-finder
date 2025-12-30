import { join, resolve } from 'node:path'

const EXTENSION_PATH_REGEX = /\.vscode-extensions\/(github\.copilot-chat-[^/]+)\/(.+)$/
const GITHUB_PREFIX_REGEX = /^github\./

export const mapPathToSourceMapPath = (path: string, root: string): string | null => {
  if (!path) {
    return null
  }
  // Path might be: .vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js
  // or absolute path
  const absolutePath = path.startsWith('/') ? path : resolve(root, path)

  // Check if this is a copilot extension file
  const extensionMatch = absolutePath.match(EXTENSION_PATH_REGEX)
  if (!extensionMatch) {
    return null
  }
  const extensionId = extensionMatch[1]
  const relativePath = extensionMatch[2]

  // Convert extension ID from github.copilot-chat-0.36.2025121004 to copilot-chat-0.36.2025121004
  // Remove 'github.' prefix
  const cacheDirName = extensionId.replace(GITHUB_PREFIX_REGEX, '')

  // Map to source maps cache directory
  const sourceMapPath = join(root, '.extension-source-maps-cache', cacheDirName, relativePath + '.map')
  return sourceMapPath
}
