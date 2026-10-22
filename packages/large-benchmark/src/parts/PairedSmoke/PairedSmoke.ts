import { mkdir } from 'node:fs/promises'
import { hostname } from 'node:os'
import { join } from 'node:path'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { writeJson } from '../Io/Io.ts'
import { runSmoke, type SmokeResult } from '../Smoke/Smoke.ts'
import { comparePairs } from '../Statistics/Statistics.ts'
import type { Revision } from '../Types/Types.ts'

export interface PairedSmokeOptions {
  commits: Record<Revision, string>
  builds: Record<Revision, string>
  harness: string
  samples: number
  output: string
}

export interface SmokePair {
  index: number
  order: Revision[]
  results: Partial<Record<Revision, SmokeResult>>
  comparable: boolean
  diagnostic?: string
}

export interface PairedSmokeResult {
  schemaVersion: 1
  kind: 'paired-smoke'
  commits: Record<Revision, string>
  requestedPairs: number
  runner: { hostname: string; node: string }
  pairs: SmokePair[]
  comparison: ReturnType<typeof comparePairs> | null
}

export const pairedSmokeSummary = (result: PairedSmokeResult): string => {
  const comparison = result.comparison
  const summary = [
    '# Paired full smoke-suite timings',
    '',
    `Before: \`${result.commits.before}\``,
    `After: \`${result.commits.after}\``,
    '',
    `Complete matching pairs: ${result.pairs.filter((pair) => pair.comparable).length}/${result.requestedPairs}.`,
    '',
    'Both revisions run sequentially on the same runner, alternating before/after order. Timings include the entire smoke process and its setup/cleanup. The compiled harness and fixture are shared. Failed attempts remain recorded and are never retried. Only complete pairs with identical successful test inventories and pending counts enter the comparison. No outliers are removed.',
    '',
  ]
  if (comparison) {
    summary.push(
      '| Metric | Before | After | Change |',
      '| --- | ---: | ---: | ---: |',
      `| Median suite time (ms) | ${comparison.before.median.toFixed(3)} | ${comparison.after.median.toFixed(3)} | ${comparison.percentChange?.toFixed(3)}% |`,
      '',
      `Exploratory paired bootstrap interval for the median difference: [${comparison.interval.map((value) => value.toFixed(3)).join(', ')}] ms. ${comparison.inconclusive ? 'The result is inconclusive.' : 'The exploratory interval excludes zero.'}`,
    )
  } else summary.push('No complete matching pairs are available. No performance comparison can be made.')
  return summary.join('\n') + '\n'
}

export const runPairedSmoke = async (options: PairedSmokeOptions, run: typeof runSmoke = runSmoke): Promise<PairedSmokeResult> => {
  if (!Number.isSafeInteger(options.samples) || options.samples < 1 || options.samples > 20)
    throw new Error('Paired smoke samples must be between 1 and 20')
  const commits = {
    before: parseCommitReference(options.commits.before).reference,
    after: parseCommitReference(options.commits.after).reference,
  }
  if (commits.before === commits.after) throw new Error('Paired smoke revisions must differ')
  const result: PairedSmokeResult = {
    schemaVersion: 1,
    kind: 'paired-smoke',
    commits,
    requestedPairs: options.samples,
    runner: { hostname: hostname(), node: process.version },
    pairs: [],
    comparison: null,
  }
  await mkdir(options.output, { recursive: true })
  const checkpoint = () => writeJson(join(options.output, 'paired-smoke-result.json'), result)
  await checkpoint()
  const before: number[] = [],
    after: number[] = []
  let inventory: string | undefined
  let harness: string | undefined
  for (let index = 0; index < options.samples; index++) {
    const pair: SmokePair = {
      index,
      order: index % 2 === 0 ? ['before', 'after'] : ['after', 'before'],
      results: {},
      comparable: false,
    }
    result.pairs.push(pair)
    for (const revision of pair.order) {
      const measured = await run({
        commit: commits[revision],
        build: options.builds[revision],
        harness: options.harness,
        samples: 1,
        output: join(options.output, `pair-${index + 1}`, revision),
      })
      pair.results[revision] = measured
      await checkpoint()
    }
    const one = pair.results.before!,
      two = pair.results.after!
    const first = one.samples[0],
      second = two.samples[0]
    const sameHarness = `${one.harnessCommit}:${one.fixtureCommit}`
    const firstInventory = JSON.stringify({ tests: [...(first?.tests ?? [])].sort(), pending: first?.pending })
    const secondInventory = JSON.stringify({ tests: [...(second?.tests ?? [])].sort(), pending: second?.pending })
    if (one.commit !== commits.before || two.commit !== commits.after || one.samples.length !== 1 || two.samples.length !== 1) {
      pair.diagnostic = 'Unexpected revision or sample count'
    } else if (first?.status !== 'success' || second?.status !== 'success') {
      pair.diagnostic = 'One or both attempts failed'
    } else if (one.runner.hostname !== two.runner.hostname || one.runner.node !== two.runner.node) {
      pair.diagnostic = 'Runner differs'
    } else if (sameHarness !== `${two.harnessCommit}:${two.fixtureCommit}` || (harness && harness !== sameHarness)) {
      pair.diagnostic = 'Harness or fixture differs'
    } else if (firstInventory !== secondInventory || (inventory && inventory !== firstInventory)) {
      pair.diagnostic = 'Successful test inventory or pending count differs'
    } else if (
      !first.tests.length ||
      !Number.isFinite(first.elapsedMs) ||
      !Number.isFinite(second.elapsedMs) ||
      first.elapsedMs <= 0 ||
      second.elapsedMs <= 0
    ) {
      pair.diagnostic = 'Invalid smoke timing or empty inventory'
    } else {
      harness = sameHarness
      inventory = firstInventory
      pair.comparable = true
      before.push(first.elapsedMs)
      after.push(second.elapsedMs)
      result.comparison = comparePairs(before, after, 'median')
    }
    await checkpoint()
    console.log(`Paired smoke ${index + 1}/${options.samples}: ${pair.comparable ? 'complete' : pair.diagnostic}`)
  }
  return result
}
