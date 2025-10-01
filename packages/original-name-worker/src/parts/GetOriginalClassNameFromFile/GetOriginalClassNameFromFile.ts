import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'
import { VError } from '@lvce-editor/verror'

export const getOriginalClassNameFromFile = async (originalCodePath: string, originalLine: number, originalColumn: number) => {
  console.log(`[OriginalNameWorker] getOriginalClassNameFromFile called for ${originalCodePath}:${originalLine}:${originalColumn}`)
  const startTime = performance.now()

  try {
    console.log(`[OriginalNameWorker] Reading file: ${originalCodePath}`)
    const readTime = performance.now()
    const originalCode: string = await readFile(originalCodePath, 'utf8')
    console.log(`[OriginalNameWorker] File read in ${(performance.now() - readTime).toFixed(2)}ms`)

    const baseName = basename(originalCodePath)
    console.log(`[OriginalNameWorker] Calling getOriginalClassName for ${baseName}`)
    const classNameTime = performance.now()
    const originalClassName: string = GetOriginalClassName.getOriginalClassName(originalCode, originalLine, originalColumn, baseName)
    console.log(`[OriginalNameWorker] getOriginalClassName completed in ${(performance.now() - classNameTime).toFixed(2)}ms`)

    const totalTime = performance.now() - startTime
    console.log(`[OriginalNameWorker] getOriginalClassNameFromFile completed in ${totalTime.toFixed(2)}ms, result: ${originalClassName}`)
    return originalClassName
  } catch (error) {
    console.log(`[OriginalNameWorker] Error in getOriginalClassNameFromFile: ${error}`)
    throw new VError(error, `Failed to compute original name for ${originalCodePath}`)
  }
}
