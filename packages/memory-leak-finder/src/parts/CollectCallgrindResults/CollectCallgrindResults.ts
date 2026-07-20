import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { CallgrindConfig } from '../CallgrindConfig/CallgrindConfig.ts'
import * as ParseCallgrindFile from '../ParseCallgrindFile/ParseCallgrindFile.ts'

export interface CallgrindProcessResult {
  readonly file: string
  readonly instructionReferences: number
  readonly outputPath: string
  readonly pid: number | undefined
}

export interface CallgrindResult {
  readonly isLeak: false
  readonly rawFilePaths: readonly string[]
  readonly skippedFiles: readonly string[]
  readonly summary: {
    readonly instructionReferences: number
    readonly processCount: number
  }
  readonly totalInstructionReferences: number
  readonly processes: readonly CallgrindProcessResult[]
}

const getPid = (file: string): number | undefined => {
  const match = file.match(/^callgrind[.]out[.](\d+)$/)
  if (!match) {
    return undefined
  }
  const pid = Number(match[1])
  if (!Number.isFinite(pid)) {
    return undefined
  }
  return pid
}

const getOutputDir = (resultPath: string): string => {
  const extension = path.extname(resultPath)
  if (!extension) {
    return `${resultPath}-raw`
  }
  return resultPath.slice(0, -extension.length)
}

export const collectCallgrindResults = async (config: CallgrindConfig, resultPath: string): Promise<CallgrindResult> => {
  const outputDir = getOutputDir(resultPath)
  await mkdir(outputDir, { recursive: true })

  const entries = await readdir(config.spoolDir)
  const files = entries.filter((entry) => entry.startsWith('callgrind.out.')).sort()
  if (files.length === 0) {
    throw new Error(`No Callgrind output files found in ${config.spoolDir}`)
  }

  const processes: CallgrindProcessResult[] = []
  const skippedFiles: string[] = []
  for (const file of files) {
    const sourcePath = path.join(config.spoolDir, file)
    const content = await readFile(sourcePath, 'utf8')
    const parsed = ParseCallgrindFile.parseCallgrindFile(content)
    if (!parsed) {
      skippedFiles.push(sourcePath)
      continue
    }
    const outputPath = path.join(outputDir, file)
    await copyFile(sourcePath, outputPath)
    processes.push({
      file,
      instructionReferences: parsed.instructionReferences,
      outputPath,
      pid: getPid(file),
    })
  }

  if (processes.length === 0) {
    throw new Error(`No valid Callgrind output files found in ${config.spoolDir}`)
  }

  const totalInstructionReferences = processes.reduce((total, item) => total + item.instructionReferences, 0)
  return {
    isLeak: false,
    processes,
    rawFilePaths: processes.map((item) => item.outputPath),
    skippedFiles,
    summary: {
      instructionReferences: totalInstructionReferences,
      processCount: processes.length,
    },
    totalInstructionReferences,
  }
}
