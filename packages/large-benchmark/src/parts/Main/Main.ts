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
import { parseCommits, validateCommits, type SeriesManifest } from '../Series/Series.ts'
import { generateTrendReport, createTrendWorkflowSummary } from '../TrendReport/TrendReport.ts'
import { historySuite } from '../CountHistory/CountHistory.ts'
import { historyMeasures } from '../CountHistoryMeasures/CountHistoryMeasures.ts'
import { measureHistories, reportHistories, type CountHistoryManifest } from '../CountHistoryBatch/CountHistoryBatch.ts'
import { resolveLastVersions, resolveVersionRange } from '../VersionRange/VersionRange.ts'
import { createCssPreset, freezeSamples, samplingPolicy, harnessSourceHash, type CssPresetMetadata } from '../CssPreset/CssPreset.ts'
import { benchmarks as legacyBenchmarks } from '../Manifest/Manifest.ts'
import { assertNativeBenchmarks, collectorArchitecture, executionPlan } from '../Architecture/Architecture.ts'

import { readyBuildMatrix, recordBuildUpload } from '../BuildReadiness/BuildReadiness.ts'

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
      const measures = historyMeasures(get('--measure', 'function-count'))
      const suite = historySuite(get('--suite', 'default'))
      if (get('--version-range') && get('--last-versions')) throw new Error('Use --version-range or --last-versions')
      const frameDurationMs = Number(get('--frame-duration-ms', '400'))
      if (!Number.isSafeInteger(frameDurationMs) || frameDurationMs < 40 || frameDurationMs > 60_000)
        throw new Error('--frame-duration-ms must be an integer between 40 and 60000')
      const releases = get('--version-range')
        ? await resolveVersionRange(get('--version-range'))
        : await resolveLastVersions(Number(get('--last-versions', '20')))
      const manifest: CountHistoryManifest =
        measures.length === 1
          ? { schemaVersion: 1, measure: `${measures[0]!}-history`, releases, frameDurationMs, suite }
          : { schemaVersion: 2, measures, releases, frameDurationMs, suite }
      await writeJson(join(output, 'manifest.json'), manifest)
      const matrix = JSON.stringify({
        include: releases.map((release) => ({ ...release, artifact: parseCommitReference(release.commit).artifact })),
      })
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`)
      else console.log(matrix)
      break
    }
    case 'history-measure': {
      await measureHistories(
        required('--commit'),
        required('--vscode-version'),
        get('--build-path') ? resolve(get('--build-path')) : '',
        output,
        historyMeasures(get('--measure', 'function-count')),
        historySuite(get('--suite', 'default')),
      )
      break
    }
    case 'history-report': {
      await reportHistories(await readJson<CountHistoryManifest>(resolve(required('--manifest'))), resolve(required('--input-dir')), output)
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
      const selected = selectBenchmarks(get('--benchmark-filter'), get('--measures'), registry).map((benchmark) => ({
        ...benchmark,
        arch: collectorArchitecture(benchmark),
      }))
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
      const plan = executionPlan(revisions, selected)
      const matrix = JSON.stringify(plan.matrix)
      const buildMatrix = JSON.stringify(plan.build_matrix)
      const smokeMatrix = JSON.stringify({
        include: selected.some((b) => b.collector === 'smoke')
          ? revisions.map((commit) => ({ commit, artifact: parseCommitReference(commit).artifact }))
          : [],
      })
      if (process.env.GITHUB_OUTPUT)
        await appendFile(
          process.env.GITHUB_OUTPUT,
          `arm_matrix=${JSON.stringify(plan.arm_matrix)}\narm_build_matrix=${JSON.stringify(plan.arm_build_matrix)}\nhas_arm=${plan.has_arm}\nhas_x64=${plan.has_x64}\nmatrix=${matrix}\nbuild_matrix=${buildMatrix}\nsmoke_matrix=${smokeMatrix}\nhas_runtime=${plan.has_runtime}\nhas_smoke=${selected.some((b) => b.collector === 'smoke')}\nsmoke_harness=${parseCommitReference(revisions[0]!).artifact}\n`,
        )
      else console.log(JSON.stringify(plan))
      break
    }
    case 'build-status': {
      await recordBuildUpload(output, required('--commit'), get('--upload-outcome') === 'success')
      break
    }
    case 'ready-matrix': {
      const arch = required('--arch')
      if (arch !== 'x64' && arch !== 'arm64') throw new Error('Expected x64 or arm64')
      const manifest = await readJson<Manifest | SeriesManifest>(resolve(required('--manifest')))
      validateRegistry(manifest.benchmarks)
      const revisions = validateCommits(manifest.schemaVersion === 1 ? Object.values(manifest.commits) : manifest.commits)
      const plan = executionPlan(revisions, manifest.benchmarks)
      const ready = await readyBuildMatrix(arch === 'x64' ? plan.matrix : plan.arm_matrix, resolve(required('--input-dir')), arch)
      const smoke =
        arch === 'x64' && manifest.benchmarks.some((b) => b.collector === 'smoke') && ready.successful.includes(revisions[0]!)
          ? ready.successful
              .filter((commit) => revisions.includes(commit))
              .map((commit) => ({ commit, artifact: parseCommitReference(commit).artifact }))
          : []
      await writeJson(join(output, 'build-readiness.json'), { ...ready, arch, smoke })
      const outputs = `matrix=${JSON.stringify(ready.matrix)}\nhas_runtime=${ready.matrix.include.length > 0}\nsmoke_matrix=${JSON.stringify({ include: smoke })}\nhas_smoke=${smoke.length > 0}\n`
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, outputs)
      else console.log(outputs)
      if (process.env.GITHUB_STEP_SUMMARY)
        await appendFile(
          process.env.GITHUB_STEP_SUMMARY,
          `### ${arch} build readiness\n\n${ready.matrix.include.length} measurement jobs ready; ${ready.skipped.length} skipped because required builds are unavailable.\n\n${ready.diagnostics.map((d) => '- ' + d).join('\n')}\n`,
        )
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
        await writeJson(join(output, 'status.json'), {
          status: 'failed',
          commit: get('--commit'),
          arch: process.arch,
          error: errorMessage(error),
        })
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
      assertNativeBenchmarks(selected)
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
        if (get('--require-complete') === 'true' && !summary.complete)
          throw new Error('Report preserved, but requested benchmark coverage is incomplete')
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
      if (get('--require-complete') === 'true' && !summary.complete)
        throw new Error('Report preserved, but requested benchmark coverage is incomplete')
      break
    }
    default:
      throw new Error(
        'Usage: large-performance <matrix|ready-matrix|build-status|prepare|extract|prepare-smoke|extract-smoke|smoke|measure|report|history-matrix|history-measure|history-report> [options]',
      )
  }
}

export const main = async (): Promise<void> => {
  await largePerformance(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error))
    process.exitCode = 1
  })
}
