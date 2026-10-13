import { appendFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { measureBundles } from './ultimatePerformance/bundles.ts'
import { errorMessage, readJson, writeJson } from './ultimatePerformance/io.ts'
import { sampleCount, selectBenchmarks } from './ultimatePerformance/manifest.ts'
import { extractBuild, prepareBuild } from './ultimatePerformance/prepare.ts'
import { generateReport } from './ultimatePerformance/report.ts'
import type { RunOptions } from './ultimatePerformance/runner.ts'
import type { Benchmark } from './ultimatePerformance/types.ts'

export interface Manifest {
  schemaVersion: 1
  commits: { before: string; after: string }
  samples: number
  benchmarks: Benchmark[]
}

export const parseOptions = (argv: string[]) => {
  const get = (name: string, fallback = ''): string => {
    const index = argv.indexOf(name)
    if (index < 0) return fallback
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value`)
    return value
  }
  const required = (name: string): string => {
    const value = get(name)
    if (!value) throw new Error(`${name} is required`)
    return value
  }
  const samples = Number(get('--samples', '37'))
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 1000) throw new Error('--samples must be an integer between 1 and 1000')
  return { get, required, samples, output: resolve(get('--output-dir', '.ultimate-performance')) }
}

export const ultimatePerformance = async (argv: string[]): Promise<void> => {
  const { get, required, samples, output } = parseOptions(argv.slice(1))
  const commits = (): { before: string; after: string } => {
    const before = required('--before-commit').toLowerCase()
    const after = required('--after-commit').toLowerCase()
    if (![before, after].every((sha) => /^[0-9a-f]{40}$/.test(sha))) throw new Error('before/after commits must be full 40-character SHAs')
    return { before, after }
  }
  switch (argv[0]) {
    case 'matrix': {
      const selected = selectBenchmarks(get('--benchmark-filter'))
      if (selected.length > 256) throw new Error('Benchmark matrix exceeds 256 jobs')
      const manifest: Manifest = { schemaVersion: 1, commits: commits(), samples, benchmarks: selected }
      await writeJson(join(output, 'manifest.json'), manifest)
      const matrix = JSON.stringify({
        include: selected.map((benchmark) => ({ id: benchmark.id, samples: sampleCount(benchmark, samples) })),
      })
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`)
      else console.log(matrix)
      break
    }
    case 'prepare': {
      try {
        await prepareBuild(required('--commit'), output)
      } catch (error) {
        await writeJson(join(output, 'status.json'), { status: 'failed', commit: get('--commit'), error: errorMessage(error) })
        throw error
      }
      break
    }
    case 'extract': {
      const path = await extractBuild(resolve(required('--input-dir')), required('--commit'))
      if (process.env.GITHUB_OUTPUT) {
        const name = required('--output-name')
        if (!/^[a-z_]+$/.test(name)) throw new Error('Invalid output name')
        await appendFile(process.env.GITHUB_OUTPUT, `${name}=${path}\n`)
      } else console.log(path)
      break
    }
    case 'measure': {
      if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('Measurements require Linux x64')
      const selected = selectBenchmarks(required('--benchmark-id'))
      if (selected.length !== 1) throw new Error('--benchmark-id must name exactly one benchmark')
      const benchmark = selected[0]!
      const options: RunOptions = {
        benchmark,
        samples,
        commits: commits(),
        output,
        paths: { before: resolve(required('--before-path')), after: resolve(required('--after-path')) },
        ...(get('--inject-failure') ? { injectFailure: get('--inject-failure') } : {}),
      }
      await mkdir(output, { recursive: true })
      if (benchmark.collector === 'bundles') await measureBundles(options)
      else {
        const { runBenchmark } = await import('./ultimatePerformance/runner.ts')
        await runBenchmark(options)
      }
      break
    }
    case 'report': {
      const manifest = await readJson<Manifest>(resolve(required('--manifest')))
      if (manifest.schemaVersion !== 1 || !manifest.benchmarks?.length) throw new Error('Invalid benchmark manifest')
      const summary = await generateReport({
        input: resolve(required('--input-dir')),
        output,
        benchmarks: manifest.benchmarks,
        commits: manifest.commits,
        ...(get('--build-outcomes') ? { buildOutcomes: get('--build-outcomes') } : {}),
      })
      console.log(`Report: ${join(output, 'index.html')}; ${summary.comparisons.length} metric comparisons`)
      if (process.env.GITHUB_STEP_SUMMARY)
        await appendFile(
          process.env.GITHUB_STEP_SUMMARY,
          `## Ultimate Performance\n\nBefore: \`${manifest.commits.before}\`\n\nAfter: \`${manifest.commits.after}\`\n\n${summary.comparisons.length} metric comparisons. Download **ultimate-performance-report** and open \`index.html\`.\n\n${summary.coverage.map((entry) => `- ${entry.benchmark}: ${entry.status} (${entry.pairs} complete pairs)`).join('\n')}\n`,
        )
      if (!summary.usable) throw new Error('Report preserved, but builds are unusable or no valid runtime comparisons exist')
      break
    }
    default:
      throw new Error('Usage: ultimate-performance <matrix|prepare|extract|measure|report> [options]')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  ultimatePerformance(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error))
    process.exitCode = 1
  })
}
