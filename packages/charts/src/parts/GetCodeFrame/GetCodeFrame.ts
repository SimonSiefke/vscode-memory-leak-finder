import { codeFrameColumns } from '@babel/code-frame'
import { existsSync, readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

interface ParseStackLineResult {
  column: number
  filePath: string
  line: number
}

const parseStackLine = (line: string): ParseStackLineResult | null => {
  // Format: "src/vs/editor/contrib/find/browser/findWidget.ts:381:69"
  const match = line
    .trim()
    .replace(/^at\s+/, '')
    .replace(/^.*\((.*)\)$/, '$1')
    .match(/^(.+):(\d+):(\d+)$/)
  if (!match) {
    return null
  }
  const [, filePath, lineStr, columnStr] = match
  return {
    column: Number.parseInt(columnStr, 10),
    filePath,
    line: Number.parseInt(lineStr, 10),
  }
}

const findSourceFile = async (relativePath: string, sourcesHash: string | null | undefined): Promise<string | null> => {
  const sourcesDir = join(Root.root, '.vscode-sources')
  if (!existsSync(sourcesDir)) {
    return null
  }

  if (sourcesHash) {
    const sourceFilePath = join(sourcesDir, sourcesHash, relativePath)
    if (existsSync(sourceFilePath)) {
      return sourceFilePath
    }
    return null
  }

  try {
    const hashDirs = await readdir(sourcesDir, { withFileTypes: true })
    for (const hashDir of hashDirs) {
      if (hashDir.isDirectory()) {
        const sourceFilePath = join(sourcesDir, hashDir.name, relativePath)
        if (existsSync(sourceFilePath)) {
          return sourceFilePath
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return null
}

export const getCodeFrame = async (stackLine: string, sourcesHash?: string | null, highlight = false): Promise<string | null> => {
  const parsed = parseStackLine(stackLine)
  if (!parsed) {
    return null
  }

  const { column, filePath, line } = parsed
  const sourceFilePath = await findSourceFile(filePath, sourcesHash)
  if (!sourceFilePath) {
    return null
  }

  try {
    const rawLines = readFileSync(sourceFilePath, 'utf8')
    const location = {
      start: {
        // Source-map columns are zero based; Babel columns are one based.
        column: column + 1,
        line: line,
      },
    }
    const codeFrame = codeFrameColumns(rawLines, location, {
      // Force color so report generation can turn Babel's token colors into
      // HTML classes even when the report is generated without a TTY.
      forceColor: highlight,
      highlightCode: highlight,
      linesAbove: 2,
      linesBelow: 2,
    })
    return codeFrame
  } catch {
    return null
  }
}
