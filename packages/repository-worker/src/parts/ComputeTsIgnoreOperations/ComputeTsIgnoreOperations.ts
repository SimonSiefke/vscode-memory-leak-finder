import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'

export interface TsIgnoreOperation {
  readonly type: 'write'
  readonly path: string
  readonly content: string
}

export interface ErrorLocationByFile {
  readonly [filePath: string]: readonly number[]
}

export const computeTsIgnoreOperations = async (
  locations: readonly { file: string; line: number }[],
): Promise<readonly TsIgnoreOperation[]> => {
  try {
    const byFile = new Map<string, number[]>()
    for (const loc of locations) {
      const list = byFile.get(loc.file)
      if (list) {
        if (!list.includes(loc.line)) {
          list.push(loc.line)
        }
      } else {
        byFile.set(loc.file, [loc.line])
      }
    }

    const operations: TsIgnoreOperation[] = []

    for (const [filePath, lines] of byFile) {
      const original = await FileSystemWorker.readFileContent(filePath)
      const originalLines = original.split('\n')
      lines.sort((a, b) => a - b)
      let offset = 0
      for (const oneBasedLine of lines) {
        const index = oneBasedLine - 1 + offset
        if (index < 0 || index > originalLines.length) {
          continue
        }
        const aboveIndex = index - 1
        if (aboveIndex >= 0) {
          const above = originalLines[aboveIndex]
          if (typeof above === 'string' && above.includes('@ts-ignore')) {
            continue
          }
        }
        const targetLine = originalLines[Math.min(index, originalLines.length - 1)] || ''
        const indentMatch = targetLine.match(/^[ \t]*/)
        const indent = indentMatch ? indentMatch[0] : ''
        originalLines.splice(index, 0, `${indent}// @ts-ignore`)
        offset++
      }
      const updated = originalLines.join('\n')
      operations.push({ type: 'write', path: filePath, content: updated })
    }

    return operations
  } catch (error) {
    throw new VError(error, 'Failed to compute ts-ignore operations')
  }
}
