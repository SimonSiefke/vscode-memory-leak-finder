import { isAbsolute, join, relative, normalize } from 'node:path'

const COPILOT_EXTENSION_PATH_REGEX = /\.vscode-extensions\/(github\.copilot-chat-[^/]+)\/(.+)$/
const JS_DEBUG_EXTENSION_PATH_REGEX = /extensions\/ms-vscode\.js-debug\/(.+)$/
const GITHUB_PREFIX_REGEX = /^github\./

const normalizePathSeparators = (path: string): string => {
  return path.replaceAll('\\', '/')
}

const extractCopilot = (root: string, normalizedPath: string) => {
  // Check if this is a copilot extension file
  const extensionMatch = normalizedPath.match(COPILOT_EXTENSION_PATH_REGEX)
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

const extractJsDebug = (root: string, normalizedPath: string, jsDebugVersion?: string) => {
  const extensionMatch = normalizedPath.match(JS_DEBUG_EXTENSION_PATH_REGEX)
  if (!extensionMatch) {
    return null
  }
  if (!jsDebugVersion) {
    console.log('[extension-source-maps] jsDebugVersion not provided for js-debug extension')
    return null
  }
  const version = jsDebugVersion
  const relativePath = extensionMatch[1]
  const cacheDirName = `vscode-js-debug-${version}`
  const sourceMapPath = join(root, '.extension-source-maps-cache', cacheDirName, 'dist', relativePath + '.map')
  return sourceMapPath
}

export const mapPathToSourceMapPath = (path: string, root: string, jsDebugVersion?: string): string | null => {
  if (!path) {
    return null
  }
  // Normalize absolute paths to relative paths
  // Handle both true absolute paths and Unix-style paths on Windows
  const normalizedRoot = normalizePathSeparators(normalize(root))
  const normalizedPathInput = normalizePathSeparators(normalize(path))
  const looksAbsolute = isAbsolute(path) || normalizedPathInput.startsWith('/')

  console.log('[extension-source-maps] path:', path)
  console.log('[extension-source-maps] root:', root)
  console.log('[extension-source-maps] normalizedRoot:', normalizedRoot)
  console.log('[extension-source-maps] normalizedPathInput:', normalizedPathInput)
  console.log('[extension-source-maps] looksAbsolute:', looksAbsolute)

  let normalizedPath = path
  if (looksAbsolute) {
    // Normalize both paths for comparison (handle Windows backslashes and cross-platform roots)

    // If the absolute path is within the root, make it relative
    if (normalizedPathInput.startsWith(normalizedRoot)) {
      // Extract relative path by removing root prefix
      // Handle both normalized paths (for cross-platform compatibility) and native relative()
      let relativePathResult = normalizedPathInput.slice(normalizedRoot.length)
      // Remove leading slash if present
      if (relativePathResult.startsWith('/')) {
        relativePathResult = relativePathResult.slice(1)
      }
      // Try native relative() as fallback, but prefer manual extraction for cross-platform compatibility
      try {
        const nativeRelative = relative(root, path)
        if (nativeRelative && !nativeRelative.startsWith('..')) {
          normalizedPath = normalizePathSeparators(nativeRelative)
        } else {
          normalizedPath = relativePathResult
        }
      } catch {
        normalizedPath = relativePathResult
      }
      console.log('[extension-source-maps] normalizedPath:', normalizedPath)
      // Ensure it starts with .vscode-extensions
      if (!normalizedPath.startsWith('.vscode-extensions')) {
        console.log('[extension-source-maps] normalizedPath does not start with .vscode-extensions')
        return null
      }
    } else {
      console.log('[extension-source-maps] normalizedPathInput does not start with normalizedRoot')
      return null
    }
  } else {
    // Normalize separators for relative paths too (for regex matching)
    normalizedPath = normalizePathSeparators(normalizedPath)
  }

  return extractCopilot(root, normalizedPath) || extractJsDebug(root, normalizedPath, jsDebugVersion)
}
