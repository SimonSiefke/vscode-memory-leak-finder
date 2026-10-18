import { appendFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { measureBundles } from '../Bundles/Bundles.ts'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { errorMessage, readJson, writeJson } from '../Io/Io.ts'
import { selectBenchmarks } from '../Manifest/Manifest.ts'
import { extractBuild, prepareBuild } from '../Prepare/Prepare.ts'
import { generateReport } from '../Report/Report.ts'
import type { RunOptions } from '../Runner/Runner.ts'
import type { Benchmark } from '../Types/Types.ts'
import { parseOptions } from '../ParseOptions/ParseOptions.ts'
import { createWorkflowSummary } from '../WorkflowSummary/WorkflowSummary.ts'
import { parseCommits, seriesMatrix, validateCommits, type SeriesManifest } from '../Series/Series.ts'
import { generateTrendReport, createTrendWorkflowSummary } from '../TrendReport/TrendReport.ts'
import { resolveVersionRange } from '../VersionRange/VersionRange.ts'

export interface Manifest {
  schemaVersion: 1
  commits: { before: string; after: string }
  samples: number
  benchmarks: Benchmark[]
}

export const largePerformance = async (argv: string[]): Promise<void> => {
  const { get, required, samples, output } = parseOptions(argv.slice(1))
  const commits = (): { before: string; after: string } => {
    const before = parseCommitReference(required('--before-commit')).reference
    const after = parseCommitReference(required('--after-commit')).reference
    return { before, after }
  }
  switch (argv[0]) {
    case 'matrix': {
      const selected = selectBenchmarks(get('--benchmark-filter'), get('--measures'))
      const inputModes = [get('--version-range'), get('--commits'), get('--before-commit') || get('--after-commit')].filter(Boolean)
      if (inputModes.length > 1)
        throw new Error('Use --version-range, --commits, or --before-commit/--after-commit; these inputs cannot be combined')
      const releases = get('--version-range') ? await resolveVersionRange(get('--version-range')) : undefined
      const revisions = releases
        ? releases.map((release) => release.commit)
        : get('--commits')
          ? parseCommits(get('--commits'))
          : validateCommits(Object.values(commits()))
      const manifest: Manifest | SeriesManifest =
        get('--commits') || releases
          ? { schemaVersion: 2, commits: revisions, samples, benchmarks: selected, ...(releases ? { releases } : {}) }
          : { schemaVersion: 1, commits: commits(), samples, benchmarks: selected }
      await writeJson(join(output, 'manifest.json'), manifest)
      const matrix = JSON.stringify({
        include: seriesMatrix(revisions, selected).include.map((pair) => ({
          ...pair,
          beforeArtifact: parseCommitReference(pair.before).artifact,
          afterArtifact: parseCommitReference(pair.after).artifact,
        })),
      })
      const buildMatrix = JSON.stringify({
        include: revisions.map((commit) => ({ commit, artifact: parseCommitReference(commit).artifact })),
      })
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `matrix=${matrix}\nbuild_matrix=${buildMatrix}\n`)
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
      for (const benchmark of selected) {
        const options: RunOptions = {
          benchmark,
          samples,
          commits: commits(),
          output: selected.length === 1 ? output : join(output, benchmark.id),
          paths: { before: resolve(required('--before-path')), after: resolve(required('--after-path')) },
          ...(get('--inject-failure') ? { injectFailure: get('--inject-failure') } : {}),
        }
        await mkdir(options.output, { recursive: true })
        if (benchmark.collector === 'bundles') await measureBundles(options)
        else {
          const { runBenchmark } = await import('../Runner/Runner.ts')
          await runBenchmark(options)
        }
      }
      break
    }
    case 'report': {
      const manifest = await readJson<Manifest | SeriesManifest>(resolve(required('--manifest')))
      if (![1, 2].includes(manifest.schemaVersion) || !manifest.benchmarks?.length) throw new Error('Invalid benchmark manifest')
      if (manifest.schemaVersion === 2) {
        validateCommits(manifest.commits)
        const summary = await generateTrendReport({ input: resolve(required('--input-dir')), output, manifest })
        console.log(`Report: ${join(output, 'index.html')}; ${summary.reports.length} adjacent revision comparisons`)
        if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, createTrendWorkflowSummary(summary))
        if (!summary.reports.some((report) => report.usable)) throw new Error('Report preserved, but no usable revision comparisons exist')
        break
      }
      const summary = await generateReport({
        input: resolve(required('--input-dir')),
        output,
        benchmarks: manifest.benchmarks,
        commits: manifest.commits,
        ...(get('--build-outcomes') ? { buildOutcomes: get('--build-outcomes') } : {}),
      })
      console.log(`Report: ${join(output, 'index.html')}; ${summary.comparisons.length} metric comparisons`)
      if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, createWorkflowSummary(summary))
      if (!summary.usable) throw new Error('Report preserved, but builds are unusable or no valid runtime comparisons exist')
      break
    }
    default:
      throw new Error('Usage: large-performance <matrix|prepare|extract|measure|report> [options]')
  }
}

export const main = async (): Promise<void> => {
  await largePerformance(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error))
    process.exitCode = 1
  })
}
