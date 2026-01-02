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
  const match = line.match(/^(.+):(\d+):(\d+)$/)
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

const findSourceFile = async (relativePath: string): Promise<string | null> => {
  const sourcesDir = join(Root.root, '.vscode-sources')
  if (!existsSync(sourcesDir)) {
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

export const getCodeFrame = async (stackLine: string): Promise<string | null> => {
  const parsed = parseStackLine(stackLine)
  if (!parsed) {
    return null
  }

  const { column, filePath, line } = parsed
  const sourceFilePath = await findSourceFile(filePath)
  if (!sourceFilePath) {
    return null
  }

  try {
    const rawLines = readFileSync(sourceFilePath, 'utf8')
    const location = {
      start: {
        column: column,
        line: line,
      },
    }
    const codeFrame = codeFrameColumns(rawLines, location, {
      highlightCode: false,
      linesAbove: 5,
      linesBelow: 5,
    })
    return codeFrame
  } catch {
    return null
  }
}
