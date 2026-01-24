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
  // First try to extract from path (reads package.json if vscodeInsidersPath provided)
  const versionFromPath = extractJsDebugVersionFromPath(path, vscodeInsidersPath)
  if (versionFromPath) {
    return versionFromPath
  }

  // Fallback to package.json if path doesn't contain version
  if (vscodeInsidersPath) {
    return extractJsDebugVersionFromPackageJson(vscodeInsidersPath)
  }

  return null
}
