import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const JS_DEBUG_EXTENSION_PATH_REGEX = /extensions\/ms-vscode\.js-debug\/(.+)$/

/**
 * Extract js-debug version from a path by reading package.json
 * Example: .vscode-extensions/ms-vscode.js-debug/dist/extension.js -> reads package.json to get version
 */
export const extractJsDebugVersion = (path: string): string => {
  const match = path.match(JS_DEBUG_EXTENSION_PATH_REGEX)
  if (!match || match.index === undefined) {
    return ''
  }

  const matchIndex = match.index
  const jsDebugDir = path.substring(0, matchIndex + match[0].length - match[1].length)
  const packageJsonPath = join(jsDebugDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.log(`[extractJsDebugVersion] Package.json not found at: ${packageJsonPath}`)
    return ''
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
    return ''
  } catch (error) {
    console.log(`[extractJsDebugVersion] Error reading package.json:`, error)
    return ''
  }
}
