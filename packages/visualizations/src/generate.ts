import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { MemoryCityDataset, MemoryCityRevision, MemoryCitySnapshot } from './types.ts'

export interface RevisionInput {
  readonly label: string
  readonly path: string
}

const emptySnapshot = (): MemoryCitySnapshot => ({
  buildings: [],
  totals: {
    allocationTraceObjects: 0,
    attributedObjects: 0,
    locationObjects: 0,
    objectCount: 0,
    retainedBytes: 0,
    runtimeObjects: 0,
    shallowBytes: 0,
  },
})

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(packageRoot, '..', '..')

const parseArguments = (argv: readonly string[]) => {
  const revisions: RevisionInput[] = []
  let out = resolve(repositoryRoot, '.vscode-charts', 'memory-city')
  let assets = resolve(packageRoot, 'dist')
  let scenario = 'memory-city'
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--revision') {
      const value = argv[++index] || ''
      const separator = value.indexOf('=')
      if (separator === -1) {
        throw new Error(`Expected --revision label=path, got ${JSON.stringify(value)}`)
      }
      revisions.push({ label: value.slice(0, separator), path: resolve(value.slice(separator + 1)) })
    } else if (argument === '--out') {
      out = resolve(argv[++index])
    } else if (argument === '--assets') {
      assets = resolve(argv[++index])
    } else if (argument === '--scenario') {
      scenario = argv[++index]
    }
  }
  if (revisions.length === 0) {
    throw new Error('At least one --revision label=path is required')
  }
  return { assets, out, revisions, scenario }
}

const findJsonFile = async (path: string): Promise<string> => {
  const info = await stat(path)
  if (info.isFile()) {
    return path
  }
  const { readdir } = await import('node:fs/promises')
  const queue = [path]
  while (queue.length > 0) {
    const current = queue.shift()!
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
      const child = join(current, entry.name)
      if (entry.isDirectory()) {
        queue.push(child)
      } else if (entry.name.endsWith('.json')) {
        const value = JSON.parse(await readFile(child, 'utf8'))
        if (value?.memoryCity || value?.owners) {
          return child
        }
      }
    }
  }
  throw new Error(`No Memory City result found in ${path}`)
}

const isSnapshot = (value: unknown): value is MemoryCitySnapshot => {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as MemoryCitySnapshot).buildings))
}

const extractOwners = (value: any): MemoryCityRevision['owners'] => {
  const memoryCity = value?.memoryCity || value
  if (isSnapshot(memoryCity)) {
    return { extensionHost: emptySnapshot(), renderer: memoryCity }
  }
  const owners = memoryCity?.owners || memoryCity
  return {
    extensionHost: isSnapshot(owners?.extensionHost) ? owners.extensionHost : emptySnapshot(),
    renderer: isSnapshot(owners?.renderer) ? owners.renderer : emptySnapshot(),
  }
}

const readRevision = async (input: RevisionInput, index: number): Promise<MemoryCityRevision> => {
  const file = await findJsonFile(input.path)
  const value = JSON.parse(await readFile(file, 'utf8'))
  const id = value?.commit || value?.id || input.label.match(/[a-f0-9]{7,40}/i)?.[0] || `${index + 1}`
  return {
    id,
    label: input.label || basename(file, '.json'),
    owners: extractOwners(value),
  }
}

export const generateMemoryCity = async (
  revisions: readonly RevisionInput[],
  scenario: string,
  assets: string,
  out: string,
): Promise<MemoryCityDataset> => {
  const dataset: MemoryCityDataset = {
    revisions: await Promise.all(revisions.map(readRevision)),
    scenario,
    schemaVersion: 1,
  }
  await mkdir(out, { recursive: true })
  await cp(assets, out, { force: true, recursive: true })
  await writeFile(join(out, 'memory-city.json'), `${JSON.stringify(dataset, null, 2)}\n`)
  const serialized = JSON.stringify(dataset).replaceAll('<', '\\u003c')
  await writeFile(join(out, 'memory-city-data.js'), `globalThis.__MEMORY_CITY_DATA__ = ${serialized}\n`)
  return dataset
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) {
  const { assets, out, revisions, scenario } = parseArguments(process.argv.slice(2))
  await generateMemoryCity(revisions, scenario, assets, out)
  console.log(`Generated VS Code Memory City at ${out}`)
}
