import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname } from 'node:path'
import * as GetWorkbenchPath from '../GetWorkbenchPath/GetWorkbenchPath.ts'
import { transformCode } from '../Transform/Transform.ts'

interface CacheMetadata {
  readonly mtimeMs: number
  readonly size: number
  readonly trackingMode: string
  readonly workbenchPath: string
}

const getMetadataPath = (outputPath: string): string => {
  return `${outputPath}.metadata.json`
}

const getCacheMetadata = (workbenchPath: string, trackingMode: string): CacheMetadata => {
  const stats = statSync(workbenchPath)
  return {
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    trackingMode,
    workbenchPath,
  }
}

const readCacheMetadata = (metadataPath: string): CacheMetadata | undefined => {
  try {
    return JSON.parse(readFileSync(metadataPath, 'utf8'))
  } catch {
    return undefined
  }
}

const isCacheMetadataEqual = (actual: CacheMetadata | undefined, expected: CacheMetadata): boolean => {
  return (
    actual?.mtimeMs === expected.mtimeMs &&
    actual?.size === expected.size &&
    actual?.trackingMode === expected.trackingMode &&
    actual?.workbenchPath === expected.workbenchPath
  )
}

export const preGenerateWorkbench = async (vscodeBinaryPath: string, outputPath: string, trackingMode = 'functions'): Promise<void> => {
  const workbenchPath = GetWorkbenchPath.getWorkbenchPath(vscodeBinaryPath)
  const metadataPath = getMetadataPath(outputPath)
  const expectedMetadata = getCacheMetadata(workbenchPath, trackingMode)

  if (existsSync(outputPath) && isCacheMetadataEqual(readCacheMetadata(metadataPath), expectedMetadata)) {
    console.log(`[PreGenerateWorkbench] Cached file already exists at: ${outputPath}, skipping transformation`)
    return
  }

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
  writeFileSync(metadataPath, JSON.stringify(expectedMetadata, null, 2), 'utf8')

  console.log(`[PreGenerateWorkbench] Successfully pre-generated workbench.desktop.main.js`)
}
