import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const JS_DEBUG_EXTENSION_PATH_REGEX = /\.vscode-extensions\/ms-vscode\.js-debug\/(.+)$/
const VERSION_REGEX = /^(\d+\.\d+\.\d+)/
const DIRECTORY_VERSION_REGEX = /extensions\/ms-vscode\.js-debug-(\d+\.\d+\.\d+)/

/**
 * Extract js-debug version from a path
 * Example: .vscode-extensions/ms-vscode.js-debug-1.105.0/dist/extension.js -> 1.105.0
 */
export const extractJsDebugVersionFromPath = (path: string): string | null => {
  const match = path.match(JS_DEBUG_EXTENSION_PATH_REGEX)
  if (!match) {
    return null
  }

  // The path after .vscode-extensions/ms-vscode.js-debug/
  const relativePath = match[1]

  // Extract version from path like: 1.105.0/dist/extension.js
  // or from directory name like: ms-vscode.js-debug-1.105.0/dist/extension.js
  const versionMatch = relativePath.match(VERSION_REGEX)
  if (versionMatch) {
    return versionMatch[1]
  }

  // Try to extract from directory name pattern: ms-vscode.js-debug-1.105.0
  const dirMatch = path.match(DIRECTORY_VERSION_REGEX)
  if (dirMatch) {
    return dirMatch[1]
  }

  return null
}

/**
 * Extract js-debug version from package.json
 * Looks for the package.json in the VS Code insiders versions directory
 */
export const extractJsDebugVersionFromPackageJson = (vscodeInsidersPath: string): string | null => {
  const packageJsonPath = join(vscodeInsidersPath, 'resources', 'app', 'extensions', 'ms-vscode.js-debug', 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.log(`[extractJsDebugVersion] Package.json not found at: ${packageJsonPath}`)
    return null
  }

  try {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent)
    const version = packageJson.version

    if (version && typeof version === 'string') {
      console.log(`[extractJsDebugVersion] Found version ${version} in package.json`)
      return version
    }

    console.log(`[extractJsDebugVersion] No valid version found in package.json`)
    return null
  } catch (error) {
    console.log(`[extractJsDebugVersion] Error reading package.json:`, error)
    return null
  }
}

/**
 * Extract js-debug version from a path, with fallback to package.json
 */
export const extractJsDebugVersion = (path: string, vscodeInsidersPath?: string): string | null => {
  // First try to extract from path
  const versionFromPath = extractJsDebugVersionFromPath(path)
  if (versionFromPath) {
    return versionFromPath
  }

  // Fallback to package.json if path doesn't contain version
  if (vscodeInsidersPath) {
    return extractJsDebugVersionFromPackageJson(vscodeInsidersPath)
  }

  return null
}
