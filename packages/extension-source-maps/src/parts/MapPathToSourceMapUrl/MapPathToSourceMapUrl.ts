import { isAbsolute, join, relative, normalize } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root } from '../Root/Root.ts'

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

const extractJsDebug = (root: string, normalizedPath: string, jsDebugVersion: string) => {
  const extensionMatch = normalizedPath.match(JS_DEBUG_EXTENSION_PATH_REGEX)
  if (!extensionMatch) {
    return null
  }
  if (!jsDebugVersion) {
    return null
  }
  const version = jsDebugVersion
  const relativePath = extensionMatch[1]
  const cacheDirName = `vscode-js-debug-${version}`
  // If the path already ends with .map, don't add another .map extension
  const sourceMapPath = join(
    root,
    '.extension-source-maps-cache',
    cacheDirName,
    'dist',
    relativePath.endsWith('.map') ? relativePath : relativePath + '.map',
  )
  return sourceMapPath
}

const mapPathToSourceMapPath = (uri: string, jsDebugVersion: string): string => {
  if (!uri) {
    return ''
  }

  const jsDebugMatch = extractJsDebug(root, uri, jsDebugVersion)

  let normalizedPath = uri
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
        const nativeRelative = relative(root, uri)
        if (nativeRelative && !nativeRelative.startsWith('..')) {
          normalizedPath = normalizePathSeparators(nativeRelative)
        } else {
          normalizedPath = relativePathResult
        }
      } catch {
        normalizedPath = relativePathResult
      }
      // Ensure it starts with .vscode-extensions or contains extensions/ms-vscode.js-debug
      if (
        !normalizedPath.startsWith('.vscode-extensions') &&
        !normalizedPath.startsWith('extensions') &&
        !normalizedPath.includes('extensions/ms-vscode.js-debug')
      ) {
        console.log(
          '[extension-source-maps] normalizedPath does not start with .vscode-extensions or contain extensions/ms-vscode.js-debug',
        )
        return null
      }
    } else {
      return null
    }
  } else {
    // Normalize separators for relative paths too (for regex matching)
    normalizedPath = normalizePathSeparators(normalizedPath)
  }

  return extractCopilot(root, normalizedPath) || extractJsDebug(root, normalizedPath, jsDebugVersion)
}

export const mapPathToSourceMapUrl = (path: string, root: string, jsDebugVersion: string): string => {
  if (!path) {
    return ''
  }
  try {
    const sourceMapPath = mapPathToSourceMapPath(path, root, jsDebugVersion)
    if (!sourceMapPath) {
      return ''
    }
    // Always return a file URL, regardless of whether the file exists
    const sourceMapUrl = pathToFileURL(sourceMapPath).toString()
    return sourceMapUrl
  } catch {
    return ''
  }
}
