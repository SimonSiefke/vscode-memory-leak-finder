import { prepareSmoke, extractSmoke, runSmoke } from '../Smoke/Smoke.ts'
import { appendFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { measureBundles } from '../Bundles/Bundles.ts'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { errorMessage, readJson, writeJson } from '../Io/Io.ts'
import { selectBenchmarks, validateRegistry } from '../Manifest/Manifest.ts'
import { extractBuild, prepareBuild } from '../Prepare/Prepare.ts'
import { generateReport } from '../Report/Report.ts'
import type { RunOptions } from '../Runner/Runner.ts'
import type { Benchmark } from '../Types/Types.ts'
import { parseOptions } from '../ParseOptions/ParseOptions.ts'
import { createWorkflowSummary } from '../WorkflowSummary/WorkflowSummary.ts'
import { parseCommits, seriesMatrix, validateCommits, type SeriesManifest } from '../Series/Series.ts'
import { generateTrendReport, createTrendWorkflowSummary } from '../TrendReport/TrendReport.ts'
import { measureFunctionCounts, reportFunctionCountHistory, type HistoryManifest } from '../FunctionCountHistory/FunctionCountHistory.ts'
import { resolveLastVersions, resolveVersionRange } from '../VersionRange/VersionRange.ts'
import { createCssPreset, freezeSamples, samplingPolicy, harnessSourceHash, type CssPresetMetadata } from '../CssPreset/CssPreset.ts'
import { benchmarks as legacyBenchmarks } from '../Manifest/Manifest.ts'

export interface Manifest {
  schemaVersion: 1
  commits: { before: string; after: string }
  samples: number
  benchmarks: Benchmark[]
  preset?: CssPresetMetadata
}

export const largePerformance = async (argv: string[]): Promise<void> => {
  const { get, required, samples, output } = parseOptions(argv.slice(1))
  const policy = samplingPolicy(get, samples)
  const commits = (): { before: string; after: string } => {
    const before = parseCommitReference(required('--before-commit')).reference
    const after = parseCommitReference(required('--after-commit')).reference
    return { before, after }
  }
  switch (argv[0]) {
    case 'history-matrix': {
      if (get('--version-range') && get('--last-versions')) throw new Error('Use --version-range or --last-versions')
      const frameDurationMs = Number(get('--frame-duration-ms', '400'))
      if (!Number.isSafeInteger(frameDurationMs) || frameDurationMs < 40 || frameDurationMs > 60_000)
        throw new Error('--frame-duration-ms must be an integer between 40 and 60000')
      const releases = get('--version-range')
        ? await resolveVersionRange(get('--version-range'))
        : await resolveLastVersions(Number(get('--last-versions', '20')))
      const manifest: HistoryManifest = { schemaVersion: 1, measure: 'function-count-history', releases, frameDurationMs }
      await writeJson(join(output, 'manifest.json'), manifest)
      const matrix = JSON.stringify({
        include: releases.map((release) => ({ ...release, artifact: parseCommitReference(release.commit).artifact })),
      })
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`)
      else console.log(matrix)
      break
    }
    case 'history-measure': {
      await measureFunctionCounts(required('--commit'), required('--vscode-version'), resolve(required('--build-path')), output)
      break
    }
    case 'history-report': {
      await reportFunctionCountHistory(
        await readJson<HistoryManifest>(resolve(required('--manifest'))),
        resolve(required('--input-dir')),
        output,
      )
      break
    }
    case 'matrix': {
      const preset = get('--preset') === 'css-specific' ? await createCssPreset(policy) : undefined
      const registry =
        preset?.benchmarks ??
        legacyBenchmarks.map((benchmark) => {
          if (benchmark.collector === 'css-selectors' && get('--css-selector-samples')) return freezeSamples(benchmark, policy)
          if (benchmark.startup && ['timing', 'instructions'].includes(benchmark.collector) && get('--startup-samples'))
            return freezeSamples(benchmark, policy)
          return benchmark
        })
      const selected = selectBenchmarks(get('--benchmark-filter'), get('--measures'), registry)
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
      if (preset) manifest.preset = preset.preset
      await writeJson(join(output, 'manifest.json'), manifest)
      const matrix = JSON.stringify({
        include: (selected.some((b) => b.collector !== 'smoke')
          ? seriesMatrix(
              revisions,
              selected.filter((b) => b.collector !== 'smoke'),
            ).include
          : []
        ).map((pair) => ({
          ...pair,
          beforeArtifact: parseCommitReference(pair.before).artifact,
          afterArtifact: parseCommitReference(pair.after).artifact,
        })),
      })
      const buildMatrix = JSON.stringify({
        include: revisions.map((commit) => ({ commit, artifact: parseCommitReference(commit).artifact })),
      })
      const smokeMatrix = JSON.stringify({
        include: selected.some((b) => b.collector === 'smoke')
          ? revisions.map((commit) => ({ commit, artifact: parseCommitReference(commit).artifact }))
          : [],
      })
      if (process.env.GITHUB_OUTPUT)
        await appendFile(
          process.env.GITHUB_OUTPUT,
          `matrix=${matrix}\nbuild_matrix=${buildMatrix}\nsmoke_matrix=${smokeMatrix}\nhas_runtime=${selected.some((b) => b.collector !== 'smoke')}\nhas_smoke=${selected.some((b) => b.collector === 'smoke')}\nsmoke_harness=${parseCommitReference(revisions[0]!).artifact}\n`,
        )
      else console.log(matrix)
      break
    }
    case 'prepare-smoke': {
      await prepareSmoke(required('--commit'), output)
      break
    }
    case 'extract-smoke': {
      await extractSmoke(resolve(required('--input-dir')))
      break
    }
    case 'smoke': {
      await runSmoke({
        commit: required('--commit'),
        build: resolve(required('--build-path')),
        harness: resolve(required('--harness-path')),
        samples,
        output,
      })
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
      const manifest = get('--manifest') ? await readJson<Manifest | SeriesManifest>(resolve(get('--manifest'))) : undefined
      if (get('--preset') === 'css-specific' && !manifest) throw new Error('Preset measurements require the frozen --manifest')
      if (manifest) {
        validateRegistry(manifest.benchmarks)
        const pair = commits()
        const revisions = manifest.schemaVersion === 1 ? Object.values(manifest.commits) : manifest.commits
        if (!revisions.some((before, index) => before === pair.before && revisions[index + 1] === pair.after))
          throw new Error('Measurement revisions do not match the frozen manifest')
        if (manifest.preset) {
          const { command } = await import('../Io/Io.ts')
          const { repositoryRoot } = await import('../Prepare/Prepare.ts')
          if ((await command('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot })) !== manifest.preset.harnessCommit)
            throw new Error('Harness revision differs from the frozen manifest')
          if ((await harnessSourceHash()) !== manifest.preset.harnessSourceSha256)
            throw new Error('Harness sources differ from the frozen manifest')
        }
      }
      const selected = selectBenchmarks(required('--benchmark-id'), '', manifest?.benchmarks ?? legacyBenchmarks)
      if (selected.some((benchmark) => benchmark.collector === 'smoke'))
        throw new Error('Use the smoke command for independent smoke-test measurements')
      const { preflightCollectors, runBenchmark } = await import('../Runner/Runner.ts')
      const facilities = await preflightCollectors(selected)
      const deadline = Date.now() + 300 * 60_000
      for (const benchmark of selected) {
        const options: RunOptions = {
          benchmark,
          samples: manifest?.samples ?? samples,
          commits: commits(),
          output: selected.length === 1 ? output : join(output, benchmark.id),
          paths: { before: resolve(required('--before-path')), after: resolve(required('--after-path')) },
          facilities,
          budgetMs: Math.max(0, deadline - Date.now()),
          ...(get('--inject-failure') ? { injectFailure: get('--inject-failure') } : {}),
        }
        await mkdir(options.output, { recursive: true })
        if (benchmark.collector === 'bundles') await measureBundles(options)
        else {
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
        ...(manifest.preset ? { preset: manifest.preset } : {}),
        ...(get('--build-outcomes') ? { buildOutcomes: get('--build-outcomes') } : {}),
      })
      console.log(`Report: ${join(output, 'index.html')}; ${summary.comparisons.length} metric comparisons`)
      if (summary.smoke) console.log(summary.smoke.summary)
      if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, createWorkflowSummary(summary))
      if (!summary.usable) throw new Error('Report preserved, but builds are unusable or no valid runtime comparisons exist')
      break
    }
    default:
      throw new Error(
        'Usage: large-performance <matrix|prepare|extract|prepare-smoke|extract-smoke|smoke|measure|report|history-matrix|history-measure|history-report> [options]',
      )
  }
}

export const main = async (): Promise<void> => {
  await largePerformance(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error))
    process.exitCode = 1
  })
}
