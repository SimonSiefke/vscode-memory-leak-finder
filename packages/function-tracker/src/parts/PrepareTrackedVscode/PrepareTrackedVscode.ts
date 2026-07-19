import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, readlink, rm, stat, symlink, writeFile, chmod, lstat } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { SourceMapConsumer, type RawSourceMap } from 'source-map'
import { transformCode } from '../Transform/Transform.ts'

interface FileMetadata {
  readonly destinationPath: string
  readonly includePatterns: readonly string[]
  readonly sourceHash: string
  readonly sourceMtimeMs: number
  readonly sourcePath: string
  readonly sourceSize: number
  readonly trackingMode: string
  readonly transformerVersion: string
}

interface SourceKind {
  readonly copyRoots: readonly CopyRoot[]
  readonly targetBinaryPath: string
}

interface CopyRoot {
  readonly excludeNodeModules: boolean
  readonly sourceMapRoot?: string
  readonly sourceRoot: string
  readonly targetRoot: string
  readonly transformRelativeRoots: readonly string[]
}

const repositoryRoot = resolve(import.meta.dirname, '..', '..', '..', '..', '..')
const trackedVscodeRoot = join(repositoryRoot, '.vscode-test', 'tracked-vscode')
const transformerFiles = [
  join(import.meta.dirname, 'PrepareTrackedVscode.ts'),
  join(import.meta.dirname, '..', 'Transform', 'Transform.ts'),
  join(import.meta.dirname, '..', 'TransformCodeWithTracking', 'TransformCodeWithTracking.ts'),
  join(import.meta.dirname, '..', 'TransformCodeWithAllocationTracking', 'TransformCodeWithAllocationTracking.ts'),
  join(import.meta.dirname, '..', 'CreateFunctionWrapperPlugin', 'CreateFunctionWrapperPlugin.ts'),
  join(import.meta.dirname, '..', 'CreateAllocationWrapperPlugin', 'CreateAllocationWrapperPlugin.ts'),
]

const excludedDirectoryNames = new Set(['.build', '.cache', '.git', '.vscode-test'])

const getHash = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

const getPathHash = (path: string): string => {
  return getHash(resolve(path)).slice(0, 16)
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const readTransformerVersion = async (): Promise<string> => {
  const hash = createHash('sha256')
  hash.update('serverless-tracked-vscode-v1')
  for (const file of transformerFiles) {
    hash.update(await readFile(file, 'utf8'))
  }
  return hash.digest('hex')
}

const readJson = async <T>(path: string): Promise<T | undefined> => {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return undefined
  }
}

const getMetadataPath = (destinationPath: string): string => {
  return `${destinationPath}.tracked-metadata.json`
}

const getFileHash = async (path: string): Promise<string> => {
  return getHash(await readFile(path, 'utf8'))
}

const getExpectedMetadata = async (
  sourcePath: string,
  destinationPath: string,
  trackingMode: string,
  transformerVersion: string,
  includePatterns: readonly string[],
): Promise<FileMetadata> => {
  const sourceStat = await stat(sourcePath)
  return {
    destinationPath,
    includePatterns,
    sourceHash: await getFileHash(sourcePath),
    sourceMtimeMs: sourceStat.mtimeMs,
    sourcePath,
    sourceSize: sourceStat.size,
    trackingMode,
    transformerVersion,
  }
}

const isMetadataEqual = (actual: FileMetadata | undefined, expected: FileMetadata): boolean => {
  return (
    actual?.destinationPath === expected.destinationPath &&
    JSON.stringify(actual?.includePatterns || []) === JSON.stringify(expected.includePatterns) &&
    actual?.sourceHash === expected.sourceHash &&
    actual?.sourceMtimeMs === expected.sourceMtimeMs &&
    actual?.sourcePath === expected.sourcePath &&
    actual?.sourceSize === expected.sourceSize &&
    actual?.trackingMode === expected.trackingMode &&
    actual?.transformerVersion === expected.transformerVersion
  )
}

const getTrackingIncludePatterns = (): readonly string[] => {
  const value = process.env.VSCODE_PERFORMANCE_TRACK_INCLUDE || '[]'
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error(`VSCODE_PERFORMANCE_TRACK_INCLUDE must be a JSON string array`)
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new Error(`VSCODE_PERFORMANCE_TRACK_INCLUDE must be a JSON string array`)
  }
  return [...new Set(parsed)]
}

const getIncludeGeneratedLocation = async (
  sourcePath: string,
  sourceMapPath: string,
  includePatterns: readonly string[],
): Promise<((line: number, column: number) => boolean) | undefined> => {
  if (includePatterns.length === 0) {
    return undefined
  }
  let sourceMapContent: string
  try {
    sourceMapContent = await readFile(sourceMapPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return () => false
    }
    throw error
  }
  let rawMap: RawSourceMap
  try {
    rawMap = JSON.parse(sourceMapContent) as RawSourceMap
  } catch {
    throw new Error(`Targeted tracking found an invalid source map for ${sourcePath} at ${sourceMapPath}`)
  }
  const consumer = new SourceMapConsumer(rawMap)
  const cache = new Map<string, boolean>()
  return (line, column) => {
    const key = `${line}:${column}`
    const cached = cache.get(key)
    if (cached !== undefined) {
      return cached
    }
    const original = consumer.originalPositionFor({
      column,
      line,
    })
    const included = Boolean(original.source && includePatterns.some((pattern) => original.source?.includes(pattern)))
    cache.set(key, included)
    return included
  }
}

const transformFileCached = async (
  sourcePath: string,
  destinationPath: string,
  trackingMode: string,
  transformerVersion: string,
  includePatterns: readonly string[],
  sourceMapPath: string,
): Promise<void> => {
  const metadataPath = getMetadataPath(destinationPath)
  const expectedMetadata = await getExpectedMetadata(sourcePath, destinationPath, trackingMode, transformerVersion, includePatterns)
  if ((await pathExists(destinationPath)) && isMetadataEqual(await readJson<FileMetadata>(metadataPath), expectedMetadata)) {
    return
  }
  const code = await readFile(sourcePath, 'utf8')
  const includeGeneratedLocation = await getIncludeGeneratedLocation(sourcePath, sourceMapPath, includePatterns)
  const transformed = await transformCode(code, {
    filename: sourcePath,
    ...(includeGeneratedLocation ? { includeGeneratedLocation } : {}),
    minify: true,
    trackingMode,
  })
  await mkdir(dirname(destinationPath), { recursive: true })
  await writeFile(destinationPath, transformed, 'utf8')
  await writeFile(metadataPath, JSON.stringify(expectedMetadata, null, 2), 'utf8')
}

const shouldExclude = (name: string, copyRoot: CopyRoot): boolean => {
  if (name === 'node_modules') {
    return copyRoot.excludeNodeModules
  }
  return excludedDirectoryNames.has(name)
}

const isPathInsideRelativeRoot = (relativePath: string, relativeRoot: string): boolean => {
  return relativePath === relativeRoot || relativePath.startsWith(`${relativeRoot}/`)
}

const shouldTransform = (relativePath: string, transformRelativeRoots: readonly string[], trackingMode: string): boolean => {
  if (!relativePath.endsWith('.js')) {
    return false
  }
  const normalized = relativePath.replaceAll('\\', '/')
  if (trackingMode === 'timeouts') {
    return normalized.endsWith('/vs/workbench/workbench.desktop.main.js')
  }
  return transformRelativeRoots.some((root) => isPathInsideRelativeRoot(normalized, root))
}

const getSourceMapPath = (sourcePath: string, relativePath: string, copyRoot: CopyRoot): string => {
  if (!copyRoot.sourceMapRoot) {
    return `${sourcePath}.map`
  }
  const normalized = relativePath.replaceAll('\\', '/')
  const marker = 'resources/app/out/'
  const bundleRelativePath = normalized.startsWith(marker) ? normalized.slice(marker.length) : normalized
  return join(copyRoot.sourceMapRoot, `${bundleRelativePath}.map`)
}

const isPathInside = (root: string, path: string): boolean => {
  const relativePath = relative(root, path)
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))
}

const copyFileIfChanged = async (sourcePath: string, destinationPath: string): Promise<void> => {
  const sourceStat = await stat(sourcePath)
  try {
    const destinationStat = await stat(destinationPath)
    if (destinationStat.size === sourceStat.size && destinationStat.mtimeMs === sourceStat.mtimeMs) {
      return
    }
  } catch {
    // Copy below.
  }
  await mkdir(dirname(destinationPath), { recursive: true })
  await copyFile(sourcePath, destinationPath)
  await chmod(destinationPath, sourceStat.mode)
}

const copySymlink = async (sourcePath: string, destinationPath: string): Promise<void> => {
  const target = await readlink(sourcePath)
  await mkdir(dirname(destinationPath), { recursive: true })
  await rm(destinationPath, { force: true, recursive: true })
  await symlink(target, destinationPath)
}

const syncCopyRoot = async (
  copyRoot: CopyRoot,
  trackingMode: string,
  transformerVersion: string,
  includePatterns: readonly string[],
  currentPath = copyRoot.sourceRoot,
): Promise<void> => {
  const entries = await readdir(currentPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && shouldExclude(entry.name, copyRoot)) {
      continue
    }
    const sourcePath = join(currentPath, entry.name)
    const relativePath = relative(copyRoot.sourceRoot, sourcePath)
    const destinationPath = join(copyRoot.targetRoot, relativePath)
    if (entry.isDirectory()) {
      await mkdir(destinationPath, { recursive: true })
      await syncCopyRoot(copyRoot, trackingMode, transformerVersion, includePatterns, sourcePath)
      continue
    }
    if (entry.isSymbolicLink()) {
      await copySymlink(sourcePath, destinationPath)
      continue
    }
    if (!entry.isFile()) {
      continue
    }
    if (shouldTransform(relativePath, copyRoot.transformRelativeRoots, trackingMode)) {
      await transformFileCached(
        sourcePath,
        destinationPath,
        trackingMode,
        transformerVersion,
        includePatterns,
        getSourceMapPath(sourcePath, relativePath, copyRoot),
      )
      continue
    }
    await copyFileIfChanged(sourcePath, destinationPath)
  }
}

const getRuntimeRoot = (binaryPath: string): string => {
  return dirname(binaryPath)
}

const getDownloadedTargetRoot = (binaryPath: string, trackingMode: string): string => {
  const runtimeRoot = getRuntimeRoot(binaryPath)
  return join(dirname(runtimeRoot), `${basename(runtimeRoot)}-modified-tracked-${trackingMode}`)
}

const getSourceRootFromScript = (binaryPath: string): string | undefined => {
  if (basename(binaryPath) !== 'code.sh' || basename(dirname(binaryPath)) !== 'scripts') {
    return undefined
  }
  return dirname(dirname(binaryPath))
}

const getSourceRootFromLocalBuild = async (binaryPath: string): Promise<string | undefined> => {
  const explicitSourceRoot = process.env.VSCODE_PERFORMANCE_SOURCE_PATH
  if (explicitSourceRoot && (await pathExists(join(explicitSourceRoot, 'out-vscode-min')))) {
    return explicitSourceRoot
  }
  const runtimeRoot = dirname(binaryPath)
  const siblingSourceRoot = join(dirname(runtimeRoot), 'source')
  if (await pathExists(join(siblingSourceRoot, 'out-vscode-min'))) {
    return siblingSourceRoot
  }
  const match = /^VSCode-[^-]+-[^-]+-(.+)$/.exec(basename(runtimeRoot))
  if (!match) {
    return undefined
  }
  const sourceRoot = join(dirname(runtimeRoot), match[1])
  return (await pathExists(sourceRoot)) ? sourceRoot : undefined
}

const getLocalSourceKind = async (binaryPath: string, trackingMode: string, includeHash: string): Promise<SourceKind | undefined> => {
  const sourceRoot = getSourceRootFromScript(binaryPath) || (await getSourceRootFromLocalBuild(binaryPath))
  if (!sourceRoot) {
    return undefined
  }
  const targetContainer = join(trackedVscodeRoot, `${basename(sourceRoot)}-${getPathHash(sourceRoot)}-${trackingMode}${includeHash}`)
  const targetSourceRoot = join(targetContainer, basename(sourceRoot))
  const binaryIsInsideSource = isPathInside(sourceRoot, binaryPath)
  const copyRoots: CopyRoot[] = [
    {
      excludeNodeModules: true,
      sourceRoot,
      targetRoot: targetSourceRoot,
      transformRelativeRoots: binaryIsInsideSource ? ['out', 'out-min', 'out-vscode-min'] : [],
    },
  ]
  let targetBinaryPath = join(targetSourceRoot, relative(sourceRoot, binaryPath))
  const runtimeRoot = dirname(binaryPath)
  if (!binaryIsInsideSource && (await pathExists(runtimeRoot))) {
    const targetRuntimeRoot = join(targetContainer, basename(runtimeRoot))
    copyRoots.push({
      excludeNodeModules: false,
      sourceMapRoot: join(sourceRoot, 'out-vscode-min'),
      sourceRoot: runtimeRoot,
      targetRoot: targetRuntimeRoot,
      transformRelativeRoots: ['resources/app/out'],
    })
    targetBinaryPath = join(targetRuntimeRoot, basename(binaryPath))
  }
  return {
    copyRoots,
    targetBinaryPath,
  }
}

const getDownloadedSourceKind = (binaryPath: string, trackingMode: string, includeHash: string): SourceKind => {
  const sourceRoot = getRuntimeRoot(binaryPath)
  const targetRoot = getDownloadedTargetRoot(binaryPath, `${trackingMode}${includeHash}`)
  return {
    copyRoots: [
      {
        excludeNodeModules: false,
        sourceRoot,
        targetRoot,
        transformRelativeRoots: ['resources/app/out'],
      },
    ],
    targetBinaryPath: join(targetRoot, basename(binaryPath)),
  }
}

export const getPreparedVscodePath = async (binaryPath: string, trackingMode = 'functions'): Promise<string> => {
  const includePatterns = getTrackingIncludePatterns()
  const includeHash = includePatterns.length === 0 ? '' : `-${getHash(JSON.stringify(includePatterns)).slice(0, 12)}`
  const sourceKind =
    (await getLocalSourceKind(binaryPath, trackingMode, includeHash)) || getDownloadedSourceKind(binaryPath, trackingMode, includeHash)
  const transformerVersion = await readTransformerVersion()
  for (const copyRoot of sourceKind.copyRoots) {
    await mkdir(copyRoot.targetRoot, { recursive: true })
    await syncCopyRoot(copyRoot, trackingMode, transformerVersion, includePatterns)
  }
  const targetStat = await lstat(sourceKind.targetBinaryPath)
  if (targetStat.isFile()) {
    await chmod(sourceKind.targetBinaryPath, targetStat.mode | 0o111)
  }
  return sourceKind.targetBinaryPath
}

export const getDownloadedModifiedFolderName = (runtimeFolderName: string, trackingMode: string): string => {
  return `${runtimeFolderName}-modified-tracked-${trackingMode}`
}
