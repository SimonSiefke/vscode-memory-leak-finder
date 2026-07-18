import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

interface RawTrackedEverythingResult {
  readonly durationMs: number
  readonly eventCount: number
  readonly eventFile: string
  readonly schemaVersion: 1
  readonly sites: readonly unknown[]
  readonly timeMarks: readonly unknown[]
}

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(packageRoot, '..', '..')

const parseArguments = (argv: readonly string[]) => {
  let assets = resolve(packageRoot, 'dist')
  let out = resolve(repositoryRoot, '.vscode-charts', 'tracked-everything')
  let results = resolve(repositoryRoot, '.vscode-memory-leak-finder-results', 'tracked-everything')
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--assets') {
      assets = resolve(argv[++index])
    } else if (argv[index] === '--out') {
      out = resolve(argv[++index])
    } else if (argv[index] === '--results') {
      results = resolve(argv[++index])
    }
  }
  return { assets, out, results }
}

const findResults = async (root: string): Promise<readonly string[]> => {
  const output: string[] = []
  const visit = async (path: string): Promise<void> => {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name)
      if (entry.isDirectory()) {
        await visit(child)
      } else if (entry.name.endsWith('.json')) {
        const value = JSON.parse(await readFile(child, 'utf8'))
        if (
          value?.schemaVersion === 1 &&
          typeof value?.eventFile === 'string' &&
          Number.isInteger(value?.eventCount) &&
          Array.isArray(value?.sites)
        ) {
          output.push(child)
        }
      }
    }
  }
  await visit(root)
  return output.toSorted()
}

const writeViewer = async (resultPath: string, resultsRoot: string, assets: string, outputRoot: string): Promise<string> => {
  const result = JSON.parse(await readFile(resultPath, 'utf8')) as RawTrackedEverythingResult
  const relativeResult = relative(resultsRoot, resultPath)
  const outputPath = join(outputRoot, relativeResult.replace(/\.json$/, ''))
  const eventSource = join(dirname(resultPath), result.eventFile)
  const eventFile = basename(result.eventFile)
  const dataset = {
    ...result,
    eventFile,
    kind: 'tracked-everything',
    scenario: relativeResult.replace(/\.json$/, '').replaceAll('\\', '/'),
  }
  await mkdir(outputPath, { recursive: true })
  await cp(assets, outputPath, { force: true, recursive: true })
  await cp(eventSource, join(outputPath, eventFile), { force: true })
  await writeFile(join(outputPath, 'tracked-everything.json'), `${JSON.stringify(dataset, null, 2)}\n`)
  await writeFile(
    join(outputPath, 'tracked-everything-data.js'),
    `globalThis.__TRACKED_EVERYTHING_DATA__ = ${JSON.stringify(dataset).replaceAll('<', '\\u003c')}\n`,
  )
  const indexPath = join(outputPath, 'index.html')
  const html = (await readFile(indexPath, 'utf8'))
    .replace('VS Code Memory City', 'VS Code Tracked Everything')
    .replace('./memory-city-data.js', './tracked-everything-data.js')
  await writeFile(indexPath, html)
  return outputPath
}

export const generateTrackedEverything = async (results: string, assets: string, out: string): Promise<readonly string[]> => {
  const resultPaths = await findResults(results)
  const outputs: string[] = []
  for (const resultPath of resultPaths) {
    outputs.push(await writeViewer(resultPath, results, assets, out))
  }
  await mkdir(out, { recursive: true })
  const links = outputs
    .map((output) => `<li><a href="./${relative(out, output).replaceAll('\\', '/')}/index.html">${relative(out, output)}</a></li>`)
    .join('\n')
  await writeFile(
    join(out, 'index.html'),
    `<!doctype html><html><head><meta charset="utf-8"><title>Tracked Everything</title></head><body><h1>Tracked Everything</h1><ul>${links}</ul></body></html>`,
  )
  return outputs
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { assets, out, results } = parseArguments(process.argv.slice(2))
  const outputs = await generateTrackedEverything(results, assets, out)
  console.log(`Generated ${outputs.length} tracked-everything visualization(s) at ${out}`)
}
