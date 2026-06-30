import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import * as GetWorkbenchPath from '../GetWorkbenchPath/GetWorkbenchPath.ts'
import { transformCode } from '../Transform/Transform.ts'

export const preGenerateWorkbench = async (vscodeBinaryPath: string, outputPath: string, trackingMode = 'functions'): Promise<void> => {
  // Check if output file already exists (cache check)
  if (existsSync(outputPath)) {
    console.log(`[PreGenerateWorkbench] Cached file already exists at: ${outputPath}, skipping transformation`)
    return
  }

  const workbenchPath = GetWorkbenchPath.getWorkbenchPath(vscodeBinaryPath)

  console.log(`[PreGenerateWorkbench] Reading workbench file from: ${workbenchPath}`)
  const originalCode = readFileSync(workbenchPath, 'utf8')

  console.log(`[PreGenerateWorkbench] Transforming workbench file...`)
  const transformedCode = await transformCode(originalCode, {
    filename: workbenchPath,
    minify: true,
    trackingMode,
  })

  console.log(`[PreGenerateWorkbench] Writing transformed file to: ${outputPath}`)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, transformedCode, 'utf8')

  console.log(`[PreGenerateWorkbench] Successfully pre-generated workbench.desktop.main.js`)
}
