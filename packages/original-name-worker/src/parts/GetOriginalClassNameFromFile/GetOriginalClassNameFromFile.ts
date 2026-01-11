import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'

export const getOriginalClassNameFromFile = async (originalCodePath: string, originalLine: number, originalColumn: number) => {
  try {
    if (originalLine === null || originalColumn === null || !existsSync(originalCodePath)) {
      return ''
    }
    const originalCode: string = await readFile(originalCodePath, 'utf8')
    const baseName = basename(originalCodePath)
    const originalClassName: string = GetOriginalClassName.getOriginalClassName(originalCode, originalLine, originalColumn, baseName)
    return originalClassName
  } catch (error) {
    throw new VError(error, `Failed to compute original name for ${originalCodePath}`)
  }
}
