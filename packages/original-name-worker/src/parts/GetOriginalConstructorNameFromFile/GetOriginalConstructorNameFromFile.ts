import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import * as GetOriginalConstructorName from '../GetOriginalConstructorName/GetOriginalConstructorName.ts'

export const getOriginalConstructorNameFromFile = async (
  originalCodePath: string,
  originalLine: number,
  originalColumn: number,
): Promise<string> => {
  try {
    if (originalLine === null || originalColumn === null || !existsSync(originalCodePath)) {
      return ''
    }
    const originalCode = await readFile(originalCodePath, 'utf8')
    return GetOriginalConstructorName.getOriginalConstructorName(originalCode, originalLine, originalColumn, basename(originalCodePath))
  } catch (error) {
    throw new VError(error, `Failed to compute original constructor name for ${originalCodePath}`)
  }
}
