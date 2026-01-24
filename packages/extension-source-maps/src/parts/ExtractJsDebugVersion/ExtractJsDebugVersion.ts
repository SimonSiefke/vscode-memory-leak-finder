import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

const JS_DEBUG_EXTENSION_PATH_REGEX = /extensions\/ms-vscode\.js-debug\/(.+)$/

/**
 * Extract js-debug version from a path by reading package.json
 * Example: .vscode-extensions/ms-vscode.js-debug/dist/extension.js -> reads package.json to get version
 */
export const extractJsDebugVersionFromPath = (path: string): string | null => {
  const match = path.match(JS_DEBUG_EXTENSION_PATH_REGEX)
  if (!match) {
    return null
  }

  // Resolve package.json path from the given path
  // The package.json should be in the ms-vscode.js-debug directory (the extension root)
  // We need to find the ms-vscode.js-debug directory, not the subdirectory

  // Find the ms-vscode.js-debug directory by going up from the current path
  // The path structure is: .../extensions/ms-vscode.js-debug/<subpath>
  // We need to find the package.json in the ms-vscode.js-debug directory
  // The package.json should be in the ms-vscode.js-debug directory
  const jsDebugDir = dirname(path)
  const packageJsonPath = join(jsDebugDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.log(`[extractJsDebugVersion] Package.json not found at: ${packageJsonPath}`)
    return null
  }

  try {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent)
    const { version } = packageJson

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
 * Extract js-debug version from a path by reading package.json
 */
export const extractJsDebugVersion = (path: string): string | null => {
  return extractJsDebugVersionFromPath(path)
}
