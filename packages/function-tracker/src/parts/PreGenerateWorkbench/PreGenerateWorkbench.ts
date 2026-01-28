import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { transformCode } from '../Transform/Transform.ts'

export const preGenerateWorkbench = async (vscodeBinaryPath: string, outputPath: string): Promise<void> => {
  // Check if output file already exists (cache check)
  if (existsSync(outputPath)) {
    console.log(`[PreGenerateWorkbench] Cached file already exists at: ${outputPath}, skipping transformation`)
    return
  }

  // Get the installation directory - binaryPath might be the executable file or the directory
  let installDir: string
  try {
    const stats = statSync(vscodeBinaryPath)
    if (stats.isFile()) {
      // If it's a file (executable), get its directory
      installDir = resolve(vscodeBinaryPath, '..')
    } else {
      // If it's already a directory, use it directly
      installDir = vscodeBinaryPath
    }
  } catch {
    // If stat fails, assume it's a directory
    installDir = vscodeBinaryPath
  }

  // Construct path to workbench.desktop.main.js
  const workbenchPath = join(installDir, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')

  console.log(`[PreGenerateWorkbench] Reading workbench file from: ${workbenchPath}`)
  const originalCode = readFileSync(workbenchPath, 'utf8')

  console.log(`[PreGenerateWorkbench] Transforming workbench file...`)
  const transformedCode = await transformCode(originalCode, {
    filename: workbenchPath,
    minify: true,
  })

  console.log(`[PreGenerateWorkbench] Writing transformed file to: ${outputPath}`)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, transformedCode, 'utf8')

  console.log(`[PreGenerateWorkbench] Successfully pre-generated workbench.desktop.main.js`)
}
