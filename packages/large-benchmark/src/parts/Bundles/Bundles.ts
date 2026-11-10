import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, relative, sep } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { writeJson } from '../Io/Io.ts'
import type { Metric, Result, Revision } from '../Types/Types.ts'
import type { RunOptions } from '../Runner/Runner.ts'

export interface Asset {
  path: string
  bytes: number
  gzip: number
  brotli: number
}

export const collectBundles = async (
  directory: string,
  compressionCache = new Map<string, { gzip: number; brotli: number }>(),
): Promise<Asset[]> => {
  const assets: Asset[] = []
  const visit = async (path: string): Promise<void> => {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name)
      if (entry.isDirectory()) await visit(child)
      else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) {
        const bytes = await readFile(child)
        const hash = createHash('sha256').update(bytes).digest('hex')
        let compressed = compressionCache.get(hash)
        if (!compressed) {
          compressed = {
            gzip: gzipSync(bytes, { level: 9 }).length,
            brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
          }
          compressionCache.set(hash, compressed)
        }
        assets.push({
          path: relative(directory, child).split(sep).join('/'),
          bytes: bytes.length,
          ...compressed,
        })
      }
    }
  }
  await visit(directory)
  if (!assets.length) throw new Error('Packaged build contains no JavaScript assets')
  return assets.sort((a, b) => a.path.localeCompare(b.path))
}

export const bundleChanges = (before: Asset[], after: Asset[]) => {
  const baseline = new Map(before.map((asset) => [asset.path, asset]))
  const candidate = new Map(after.map((asset) => [asset.path, asset]))
  return [...new Set([...baseline.keys(), ...candidate.keys()])]
    .map((path) => {
      const start = baseline.get(path)
      const end = candidate.get(path)
      return {
        path,
        status: start ? (end ? 'changed' : 'removed') : 'added',
        before: start?.bytes ?? 0,
        after: end?.bytes ?? 0,
        delta: (end?.bytes ?? 0) - (start?.bytes ?? 0),
        gzipDelta: (end?.gzip ?? 0) - (start?.gzip ?? 0),
        brotliDelta: (end?.brotli ?? 0) - (start?.brotli ?? 0),
      }
    })
    .filter((asset) => asset.delta || asset.gzipDelta || asset.brotliDelta)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

export const measureBundles = async (options: RunOptions): Promise<Result> => {
  const assets: Record<Revision, Asset[]> = { before: [], after: [] }
  const compressionCache = new Map<string, { gzip: number; brotli: number }>()
  const result: Result = {
    schemaVersion: 1,
    benchmark: options.benchmark,
    commits: options.commits,
    requestedSamples: 1,
    status: 'success',
    runner: { node: process.version },
    samples: [],
    diagnostics: [],
  }
  for (const [order, revision] of (['before', 'after'] as const).entries()) {
    const started = performance.now()
    try {
      assets[revision] = await collectBundles(dirname(options.paths[revision]), compressionCache)
      const metrics: Metric[] = (['bytes', 'gzip', 'brotli'] as const).map((field) => ({
        name: `javascript-${field}`,
        unit: 'bytes',
        value: assets[revision].reduce((sum, asset) => sum + asset[field], 0),
        coverage: 'all packaged .js/.mjs/.cjs assets; source maps excluded; per-file compression',
      }))
      await writeJson(join(options.output, `${revision}-assets.json`), assets[revision])
      result.samples.push({
        pair: 0,
        revision,
        order,
        status: 'success',
        metrics,
        raw: [`${revision}-assets.json`],
        diagnostics: [],
        elapsedMs: performance.now() - started,
      })
    } catch (error) {
      result.status = 'partial'
      result.samples.push({
        pair: 0,
        revision,
        order,
        status: 'failed',
        metrics: [],
        raw: [],
        diagnostics: [String(error)],
        elapsedMs: performance.now() - started,
      })
    }
    await writeJson(join(options.output, 'result.json'), result)
  }
  if (assets.before.length && assets.after.length)
    await writeJson(join(options.output, 'bundle-changes.json'), bundleChanges(assets.before, assets.after))
  return result
}
