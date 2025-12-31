import { isAbsolute, join, relative, normalize } from 'node:path'

const EXTENSION_PATH_REGEX = /\.vscode-extensions\/(github\.copilot-chat-[^/]+)\/(.+)$/
const GITHUB_PREFIX_REGEX = /^github\./

const normalizePathSeparators = (path: string): string => {
  return path.replace(/\\/g, '/')
}

export const mapPathToSourceMapPath = (path: string, root: string): string | null => {
  if (!path) {
    return null
  }
  // Normalize absolute paths to relative paths
  let normalizedPath = path
  if (isAbsolute(path)) {
    // Normalize both paths for comparison (handle Windows backslashes and cross-platform roots)
    const normalizedRoot = normalizePathSeparators(normalize(root))
    const normalizedAbsolutePath = normalizePathSeparators(normalize(path))
    
    // If the absolute path is within the root, make it relative
    if (normalizedAbsolutePath.startsWith(normalizedRoot)) {
      normalizedPath = relative(root, path)
      // Normalize separators for regex matching
      normalizedPath = normalizePathSeparators(normalizedPath)
      // Ensure it starts with .vscode-extensions
      if (!normalizedPath.startsWith('.vscode-extensions')) {
        return null
      }
    } else {
      return null
    }
  } else {
    // Normalize separators for relative paths too (for regex matching)
    normalizedPath = normalizePathSeparators(normalizedPath)
  }
  // Check if this is a copilot extension file
  const extensionMatch = normalizedPath.match(EXTENSION_PATH_REGEX)
  if (!extensionMatch) {
    return null
  }
  const extensionId = extensionMatch[1]
  const relativePath = extensionMatch[2]

  // Convert extension ID from github.copilot-chat-0.36.2025121004 to copilot-chat-0.36.2025121004
  // Remove 'github.' prefix
  let cacheDirName = extensionId.replace(GITHUB_PREFIX_REGEX, '')

  // Strip 'v' prefix from version if present
  // VS Code extension directories don't have 'v' prefix in version, so strip it if present
  // This ensures consistency: copilot-chat-v0.36.2025121004 -> copilot-chat-0.36.2025121004
  // Pattern: copilot-chat-v<version> -> copilot-chat-<version>
  if (cacheDirName.startsWith('copilot-chat-v')) {
    cacheDirName = cacheDirName.replace('copilot-chat-v', 'copilot-chat-')
  }

  // Map to source maps cache directory
  const sourceMapPath = join(root, '.extension-source-maps-cache', cacheDirName, relativePath + '.map')
  return sourceMapPath
}
