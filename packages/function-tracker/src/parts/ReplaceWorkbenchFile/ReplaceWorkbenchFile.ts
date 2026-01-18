import { copyFile, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const getTransformedCodePath = (): string => {
  const root = join(import.meta.dirname, '..', '..', '..', '..', '..')
  return join(root, 'packages', 'function-tracker', 'workbench.desktop.main.tracked.js')
}

const getOriginalWorkbenchPath = (binaryPath: string, platform: string): string => {
  // binaryPath is the path to the executable (e.g., /path/to/code or /path/to/Code.exe)
  // We need to get to resources/app/out/vs/workbench/workbench.desktop.main.js
  if (platform === 'darwin') {
    // On macOS: binaryPath is Contents/MacOS/Electron, so go up to Contents/Resources/app
    return resolve(binaryPath, '..', '..', 'Resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  }
  if (platform === 'win32') {
    // On Windows: binaryPath is Code.exe, so go to resources/app
    return resolve(binaryPath, '..', 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  }
  // On Linux: binaryPath is code, so go to resources/app
  return resolve(binaryPath, '..', 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
}

export const replaceWorkbenchFile = async (binaryPath: string, platform: string): Promise<{ backupPath: string; restored: () => Promise<void> }> => {
  const originalPath = getOriginalWorkbenchPath(binaryPath, platform)
  const transformedPath = getTransformedCodePath()
  const backupPath = `${originalPath}.backup`

  try {
    // Check if transformed file exists
    const transformedCode = readFileSync(transformedPath, 'utf8')
    
    // Create backup of original file
    await copyFile(originalPath, backupPath)

    // Replace with transformed code
    writeFileSync(originalPath, transformedCode, 'utf8')

    console.log(`[FunctionTracker] Replaced ${originalPath} with transformed code (backup: ${backupPath})`)

    return {
      backupPath,
      async restored() {
        // Restore original file from backup
        await copyFile(backupPath, originalPath)
        console.log(`[FunctionTracker] Restored original file from backup`)
      },
    }
  } catch (error) {
    console.error(`[FunctionTracker] Error replacing workbench file:`, error)
    throw error
  }
}
