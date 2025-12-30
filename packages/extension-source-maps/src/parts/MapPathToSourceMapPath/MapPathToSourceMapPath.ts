import { join, resolve } from 'node:path'

export const mapPathToSourceMapPath = (path: string, root: string): string | null => {
  if (!path) {
    return null
  }
  // Path might be: .vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js
  // or absolute path
  const absolutePath = path.startsWith('/') ? path : resolve(root, path)

  // Check if this is a copilot extension file
  const extensionMatch = absolutePath.match(/\.vscode-extensions\/(github\.copilot-chat-[^/]+)\/(.+)$/)
  if (!extensionMatch) {
    return null
  }
  const extensionId = extensionMatch[1]
  const relativePath = extensionMatch[2]

  // Convert extension ID from github.copilot-chat-0.36.2025121004 to copilot-chat-v0.36.2025121004
  // Remove 'github.' prefix
  const withoutPrefix = extensionId.replace(/^github\./, '')
  // Add 'v' prefix to version if not present
  const cacheDirName = withoutPrefix.startsWith('copilot-chat-v') ? withoutPrefix : withoutPrefix.replace(/^copilot-chat-/, 'copilot-chat-v')

  // Map to source maps cache directory
  const sourceMapPath = join(root, '.extension-source-maps-cache', cacheDirName, relativePath + '.map')
  return sourceMapPath
}

