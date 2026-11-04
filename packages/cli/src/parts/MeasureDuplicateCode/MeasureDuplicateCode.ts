import { access, mkdir, realpath, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { Worker } from 'node:worker_threads'
import type {
  DuplicateGroup,
  FileAnalysis,
  FunctionOccurrence,
  SourceMapReference,
  SourceMapResult,
  SourceMapSummary,
} from '../DuplicateCode/DuplicateCode.ts'

interface Options {
  readonly files: readonly string[]
  readonly output: string
  readonly sourceType: 'script' | 'module'
  readonly sourceMaps: boolean
}

const getValues = (argv: readonly string[], flag: string): string[] => {
  const values: string[] = []
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] !== flag) continue
    const value = argv[++index]
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
    values.push(value)
  }
  return values
}

const findWorkbench = async (vscodePath: string): Promise<string> => {
  if (vscodePath.endsWith('.js')) return vscodePath
  for (const prefix of ['', 'resources/app', 'Contents/Resources/app']) {
    const candidate = join(vscodePath, prefix, 'out/vs/workbench/workbench.desktop.main.js')
    try {
      await access(candidate)
      return candidate
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  throw new Error(`Cannot find workbench.desktop.main.js under ${vscodePath}. Use --source-file to specify the bundle directly.`)
}

export const parseOptions = async (argv: readonly string[]): Promise<Options> => {
  const files = getValues(argv, '--source-file')
  const vscodePaths = getValues(argv, '--vscode-path')
  for (const vscodePath of vscodePaths) files.push(await findWorkbench(vscodePath))
  if (!files.length) throw new Error('duplicate-code requires --source-file <bundle.js> or --vscode-path <existing VS Code installation>')
  const sourceType = getValues(argv, '--source-type').at(-1) || 'module'
  if (sourceType !== 'module' && sourceType !== 'script') throw new Error('--source-type must be module or script')
  const output = resolve(getValues(argv, '--duplicate-code-output').at(-1) || '.vscode-duplicate-code/results.json')
  const uniqueFiles = [...new Set(await Promise.all(files.map((file) => realpath(file))))].sort()
  if (uniqueFiles.includes(output)) throw new Error('The duplicate-code output must not overwrite an input file')
  // Catch aliases through existing symlinks as well.
  try {
    if (uniqueFiles.includes(await realpath(output))) throw new Error('The duplicate-code output must not overwrite an input file')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  return { files: uniqueFiles, output, sourceType, sourceMaps: !argv.includes('--no-source-maps') }
}

const runWorker = <T>(url: URL, file: string, workerData: object): Promise<T> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(url, {
      workerData,
      resourceLimits: { maxOldGenerationSizeMb: 1536 },
    })
    let result: T | undefined
    worker.once('message', (message: T) => {
      result = message
    })
    worker.once('error', (error: Error) => reject(new Error(`duplicate-code failed for ${file}: ${error.message}`, { cause: error })))
    worker.once('exit', (code) => {
      if (code === 0 && result) resolve(result)
      else reject(new Error(`duplicate-code worker exited with code ${code} for ${file} without a result`))
    })
  })

const addOriginalLocations = async (
  file: string,
  reference: SourceMapReference | undefined,
  occurrences: readonly FunctionOccurrence[],
): Promise<SourceMapSummary> => {
  const positions: number[] = []
  for (const occurrence of occurrences) positions.push(occurrence.line, occurrence.column)
  try {
    const { locations, url } = await runWorker<SourceMapResult>(
      new URL('../DuplicateCodeSourceMapWorker/DuplicateCodeSourceMapWorker.ts', import.meta.url),
      file,
      { file, reference, positions },
    )
    let mapped = 0
    for (let index = 0; index < occurrences.length; index++) {
      const location = locations[index]
      if (location) {
        occurrences[index].originalLocation = location
        mapped++
      }
    }
    return { status: 'mapped', url, occurrences: occurrences.length, mapped }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error(`duplicate-code: source map unavailable for ${file}; keeping generated locations: ${reason}`)
    return { status: 'unavailable', occurrences: occurrences.length, mapped: 0, reason }
  }
}

export const measureDuplicateCode = async (argv: readonly string[]): Promise<void> => {
  const options = await parseOptions(argv)
  const byHash = new Map<string, FunctionOccurrence[]>()
  const files: (Omit<FileAnalysis, 'fingerprints' | 'sourceMap'> & { sourceMap?: SourceMapSummary })[] = []
  const sourceMaps = new Map<string, SourceMapReference>()
  // Never keep multiple ASTs or scope graphs alive; worker exit releases each one.
  for (const file of options.files) {
    console.error(`duplicate-code: scanning ${file}`)
    const { fingerprints, sourceMap, ...summary } = await runWorker<FileAnalysis>(
      new URL('../DuplicateCodeWorker/DuplicateCodeWorker.ts', import.meta.url),
      file,
      { file, sourceType: options.sourceType },
    )
    if (sourceMap) sourceMaps.set(file, sourceMap)
    files.push(summary)
    for (const { hash, occurrence } of fingerprints) {
      const existing = byHash.get(hash)
      if (existing) existing.push(occurrence)
      else byHash.set(hash, [occurrence])
    }
  }
  const groups: DuplicateGroup[] = []
  for (const [hash, occurrences] of byHash) {
    if (occurrences.length < 2) continue
    occurrences.sort((a, b) => a.file.localeCompare(b.file) || a.start - b.start)
    const sizes = occurrences.map((occurrence) => occurrence.bytes)
    groups.push({
      hash,
      count: occurrences.length,
      duplicateBytes: sizes.reduce((sum, size) => sum + size, 0) - sizes.reduce((max, size) => Math.max(max, size), 0),
      occurrences,
    })
  }
  // Drop unique occurrences before loading any source maps.
  byHash.clear()
  groups.sort((a, b) => b.duplicateBytes - a.duplicateBytes || a.hash.localeCompare(b.hash))
  const occurrencesByFile = new Map<string, FunctionOccurrence[]>()
  for (const group of groups) {
    for (const occurrence of group.occurrences) {
      let occurrences = occurrencesByFile.get(occurrence.file)
      if (!occurrences) occurrencesByFile.set(occurrence.file, (occurrences = []))
      occurrences.push(occurrence)
    }
  }
  // The parsing workers have exited. Resolve only reported occurrences, in one
  // batch per bundle, and release each map's memory before starting the next.
  for (const file of files) {
    const occurrences = occurrencesByFile.get(file.file) || []
    if (!options.sourceMaps || !occurrences.length) {
      file.sourceMap = { status: 'skipped', occurrences: occurrences.length, mapped: 0 }
      continue
    }
    console.error(`duplicate-code: mapping ${occurrences.length} duplicate occurrences in ${file.file}`)
    file.sourceMap = await addOriginalLocations(file.file, sourceMaps.get(file.file), occurrences)
  }
  const duplicateFunctions = groups.reduce((sum, group) => sum + group.count - 1, 0)
  const report = {
    measure: 'duplicate-code',
    sourceType: options.sourceType,
    files,
    summary: {
      functions: files.reduce((sum, file) => sum + file.functions, 0),
      skippedDynamicFunctions: files.reduce((sum, file) => sum + file.skippedDynamicFunctions, 0),
      duplicateGroups: groups.length,
      duplicateFunctions,
    },
    groups,
  }
  await mkdir(dirname(options.output), { recursive: true })
  await writeFile(options.output, JSON.stringify(report, null, 2) + '\n')
  console.log(`duplicate-code: ${groups.length} groups, ${duplicateFunctions} duplicate functions; report: ${options.output}`)
}
