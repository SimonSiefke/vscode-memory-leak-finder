import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { MemoryCityDataset, MemoryCityRevision } from './types.ts'

interface DatasetInput {
  readonly label: string
  readonly path: string
}

const parseArguments = (argv: readonly string[]) => {
  const revisions: DatasetInput[] = []
  let out = resolve('.measure-runs', 'memory-city')
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--revision') {
      const value = argv[++index] || ''
      const separator = value.indexOf('=')
      if (separator === -1) {
        throw new Error(`Expected --revision label=dataset, got ${JSON.stringify(value)}`)
      }
      revisions.push({ label: value.slice(0, separator), path: resolve(value.slice(separator + 1)) })
    } else if (argv[index] === '--out') {
      out = resolve(argv[++index])
    }
  }
  if (revisions.length === 0) {
    throw new Error('At least one --revision label=dataset is required')
  }
  return { out, revisions }
}

export const mergeMemoryCityDatasets = async (inputs: readonly DatasetInput[], out: string): Promise<MemoryCityDataset> => {
  const datasets = await Promise.all(
    inputs.map(async (input) => ({
      input,
      value: JSON.parse(await readFile(input.path, 'utf8')) as MemoryCityDataset,
    })),
  )
  const revisions: MemoryCityRevision[] = datasets.flatMap(({ input, value }, datasetIndex) =>
    value.revisions.map((revision, revisionIndex) => ({
      ...revision,
      id: revision.id === `${revisionIndex + 1}` ? `${datasetIndex + 1}` : revision.id,
      label: input.label,
    })),
  )
  const dataset: MemoryCityDataset = {
    revisions,
    scenario: datasets[0].value.scenario,
    schemaVersion: 1,
  }
  await rm(out, { force: true, recursive: true })
  await mkdir(out, { recursive: true })
  await cp(dirname(inputs[0].path), out, { force: true, recursive: true })
  await writeFile(join(out, 'memory-city.json'), `${JSON.stringify(dataset, null, 2)}\n`)
  await writeFile(
    join(out, 'memory-city-data.js'),
    `globalThis.__MEMORY_CITY_DATA__ = ${JSON.stringify(dataset).replaceAll('<', '\\u003c')}\n`,
  )
  return dataset
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { out, revisions } = parseArguments(process.argv.slice(2))
  await mergeMemoryCityDatasets(revisions, out)
  console.log(`Merged VS Code Memory City at ${out}`)
}
