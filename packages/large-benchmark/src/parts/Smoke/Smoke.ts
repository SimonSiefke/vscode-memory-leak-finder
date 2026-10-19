import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { hostname } from 'node:os'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { command, errorMessage, readJson, writeJson } from '../Io/Io.ts'
import { repositoryRoot, sha256 } from '../Prepare/Prepare.ts'
import { summarize } from '../Statistics/Statistics.ts'

export interface SmokeSample {
  index: number
  status: 'success' | 'failed'
  elapsedMs: number
  tests: string[]
  pending: number
  error?: string
}
export interface SmokeResult {
  schemaVersion: 1
  commit: string
  harnessCommit: string
  fixtureCommit: string
  requestedSamples: number
  runner: { hostname: string; node: string }
  samples: SmokeSample[]
}
interface HarnessMetadata {
  schemaVersion: 1
  harnessCommit: string
  fixtureCommit: string
  archiveSha256: string
}

// Reuse one compiled suite and fixture for every revision in the comparison.
export const prepareSmoke = async (commit: string, output: string): Promise<void> => {
  const { sha, reference } = parseCommitReference(commit)
  const source = join(repositoryRoot, '.vscode-repos', `${sha}-minified`, 'source')
  if ((await command('git', ['rev-parse', 'HEAD'], { cwd: source })) !== sha) throw new Error('Smoke harness checkout mismatch')
  await command('npm', ['run', 'compile', '--prefix', 'test/smoke'], { cwd: source, timeout: 600000, inherit: true })
  output = resolve(output)
  const fixture = join(output, 'fixture')
  await mkdir(output, { recursive: true })
  await command('git', ['clone', '--depth', '1', 'https://github.com/microsoft/vscode-smoketest-express', fixture], { timeout: 120000 })
  const fixtureCommit = await command('git', ['rev-parse', 'HEAD'], { cwd: fixture })
  const archive = join(output, 'smoke.tar.gz')
  // Keep runtime helpers with the compiled tests (chat suites load scripts/chat-simulation directly).
  // Measurement jobs never rebuild or install the suite.
  await command(
    'tar',
    ['-czf', archive, '-C', source, 'test', 'scripts', 'node_modules', 'package.json', 'product.json', '-C', resolve(output), 'fixture'],
    { timeout: 600000 },
  )
  await writeJson(join(output, 'smoke-build.json'), {
    schemaVersion: 1,
    harnessCommit: reference,
    fixtureCommit,
    archiveSha256: await sha256(archive),
  })
}

export const extractSmoke = async (input: string): Promise<void> => {
  const metadata = await readJson<HarnessMetadata>(join(input, 'smoke-build.json'))
  if (metadata.schemaVersion !== 1 || (await sha256(join(input, 'smoke.tar.gz'))) !== metadata.archiveSha256)
    throw new Error('Smoke harness checksum mismatch')
  parseCommitReference(metadata.harnessCommit)
  await command('tar', ['-xzf', join(input, 'smoke.tar.gz'), '-C', input], { timeout: 600000 })
}

// A small Mocha entry point records the exact successful test inventory and disables retries.
// The upstream entry point selects its reporter based on CI environment variables and cannot emit this JSON.
export const smokeRunner = `
const { createRequire } = require('node:module');
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const root = process.argv[2], report = process.argv[3];
const load = createRequire(join(root, 'test/index.js'));
const Mocha = load('mocha');
const mocha = new Mocha({ timeout: 120000, retries: 0, reporter: 'spec', failZero: true });
mocha.addFile(join(root, 'out/main.js'));
const tests = []; let pending = 0, retried = false;
const runner = mocha.run(failures => {
  writeFileSync(report, JSON.stringify({ tests: tests.sort(), pending, failures, retried }));
  process.exit(failures || retried || !tests.length ? 1 : 0);
});
runner.on('pass', test => tests.push(test.fullTitle()));
runner.on('pending', () => pending++);
runner.on('retry', () => { retried = true; });
`

export interface SmokeOptions {
  commit: string
  build: string
  harness: string
  samples: number
  output: string
}
export const runSmoke = async (options: SmokeOptions, execute = command): Promise<SmokeResult> => {
  if (!Number.isSafeInteger(options.samples) || options.samples < 1 || options.samples > 1000) throw new Error('Invalid smoke sample count')
  const metadata = await readJson<HarnessMetadata>(join(options.harness, 'smoke-build.json'))
  if (metadata.schemaVersion !== 1) throw new Error('Invalid smoke harness metadata')
  const result: SmokeResult = {
    schemaVersion: 1,
    commit: parseCommitReference(options.commit).reference,
    harnessCommit: metadata.harnessCommit,
    fixtureCommit: metadata.fixtureCommit,
    requestedSamples: options.samples,
    runner: { hostname: hostname(), node: process.version },
    samples: [],
  }
  await mkdir(options.output, { recursive: true })
  const script = resolve(options.output, 'smoke-runner.cjs')
  await writeFile(script, smokeRunner)
  const checkpoint = () => writeJson(join(options.output, 'smoke-result.json'), result)
  await checkpoint()
  for (let index = 0; index < options.samples; index++) {
    const sampleDirectory = resolve(options.output, `sample-${index + 1}`)
    await mkdir(sampleDirectory, { recursive: true })
    const report = join(sampleDirectory, 'mocha.json')
    const started = performance.now()
    const sample: SmokeSample = { index, status: 'failed', elapsedMs: 0, tests: [], pending: 0 }
    try {
      const stdout = await execute(
        process.execPath,
        [
          script,
          join(options.harness, 'test/smoke'),
          report,
          '--build',
          dirname(options.build),
          '--test-repo',
          join(options.harness, 'fixture'),
          '--skip-stable-build',
          '--electronArgs=--no-sandbox',
        ],
        {
          cwd: join(options.harness, 'test/smoke'),
          timeout: 20 * 60 * 1000,
          // Packaged VS Code treats any nonempty VSCODE_DEV value (including '0') as development mode.
          env: { VSCODE_QUALITY: 'oss', VSCODE_DEV: undefined, GITHUB_WORKSPACE: '', BUILD_ARTIFACTSTAGINGDIRECTORY: '' },
        },
      )
      sample.elapsedMs = performance.now() - started
      await writeFile(join(sampleDirectory, 'stdout.log'), stdout)
      const mocha = await readJson<{ tests: string[]; pending: number; failures: number; retried: boolean }>(report)
      if (
        mocha.failures !== 0 ||
        mocha.retried ||
        !Array.isArray(mocha.tests) ||
        !mocha.tests.length ||
        !mocha.tests.every((test) => typeof test === 'string')
      )
        throw new Error('Incomplete smoke test run')
      sample.tests = mocha.tests
      sample.pending = mocha.pending
      sample.status = 'success'
    } catch (error) {
      sample.elapsedMs = performance.now() - started
      sample.error = errorMessage(error)
      await writeFile(join(sampleDirectory, 'error.log'), sample.error)
    }
    // Upstream clears these directories on each invocation. Preserve evidence before starting the next attempt.
    for (const name of ['logs', 'crashes'])
      await cp(join(options.harness, '.build', name), join(sampleDirectory, name), { recursive: true }).catch(() => {})
    result.samples.push(sample)
    await checkpoint()
    console.log(`Smoke ${result.commit} ${index + 1}/${options.samples}: ${sample.status} (${Math.round(sample.elapsedMs)} ms)`)
  }
  return result
}

const escape = (value: unknown): string => String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const format = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 3 })
export const compareSmoke = (before: SmokeResult, after: SmokeResult) => {
  if (before.harnessCommit !== after.harnessCommit || before.fixtureCommit !== after.fixtureCommit)
    throw new Error('Smoke harness or fixture differs')
  const successful = (result: SmokeResult) => result.samples.filter((s) => s.status === 'success')
  const baseline = successful(before),
    candidate = successful(after)
  const inventory = JSON.stringify(baseline[0]?.tests)
  if (!baseline.length || !candidate.length) throw new Error('No successful smoke samples for both commits')
  if ([...baseline, ...candidate].some((s) => JSON.stringify(s.tests) !== inventory || s.pending !== baseline[0]!.pending))
    throw new Error('Smoke test inventory differs between samples')
  return { before: summarize(baseline.map((s) => s.elapsedMs)), after: summarize(candidate.map((s) => s.elapsedMs)) }
}

export const smokeComparison = (before: SmokeResult, after: SmokeResult) => {
  const statistics = compareSmoke(before, after)
  const rows = (['mean', 'median'] as const).map((name) => {
    const baseline = statistics.before[name],
      candidate = statistics.after[name]
    return {
      name,
      before: baseline,
      after: candidate,
      change: candidate - baseline,
      percent: baseline === 0 ? null : (candidate / baseline - 1) * 100,
    }
  })
  const summary = `### Smoke test timings\n\nIndependent runners; successful suite process wall time including setup/cleanup. Runner differences can affect results; no paired confidence interval or significance claim. Stable-version migration tests are skipped.\n\nBefore: ${before.commit}; after: ${after.commit}.\nHarness: ${before.harnessCommit}; fixture: ${before.fixtureCommit}.\n\nSuccessful attempts: ${statistics.before.count}/${before.requestedSamples} before, ${statistics.after.count}/${after.requestedSamples} after. Failed/missing attempts are excluded, never retried.\n\n| Statistic | Before (ms) | After (ms) | Change (ms) | Change (%) |\n| --- | ---: | ---: | ---: | ---: |\n${rows.map((row) => `| ${row.name} | ${format(row.before)} | ${format(row.after)} | ${format(row.change)} | ${row.percent === null ? 'N/A' : format(row.percent)} |`).join('\n')}\n`
  const max = Math.max(...rows.flatMap((row) => [row.before, row.after]), 1)
  const bars = rows
    .map((row, index) => {
      const y = 80 + index * 110
      return `<text x="20" y="${y - 10}">${row.name} (ms)</text>${(
        [
          ['Before', row.before, '#5479e8'],
          ['After', row.after, '#a253ca'],
        ] as const
      )
        .map(
          ([label, value, color], i) =>
            `<text x="20" y="${y + i * 36 + 18}">${label}</text><rect x="110" y="${y + i * 36}" width="${(value / max) * 480}" height="25" fill="${color}"/><text x="${120 + (value / max) * 480}" y="${y + i * 36 + 18}">${format(value)}</text>`,
        )
        .join('')}`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="370" role="img" aria-label="Smoke test mean and median comparison"><rect width="850" height="370" fill="white"/><g font-family="system-ui" font-size="14"><text x="20" y="25">Smoke tests: mean / median · lower is better</text><text x="20" y="48">Successful attempts: ${statistics.before.count}/${before.requestedSamples} before; ${statistics.after.count}/${after.requestedSamples} after</text>${bars}<text x="20" y="300">Before: ${escape(before.commit)}</text><text x="20" y="323">After: ${escape(after.commit)}</text><text x="20" y="350">Independent runners; descriptive comparison; failed attempts excluded.</text></g></svg>`
  const html = `<p>Independent runners; successful suite process wall time including setup/cleanup. Runner differences can affect results. No paired confidence interval or significance claim. Stable-version migration tests are skipped.</p><p>Successful attempts: ${statistics.before.count}/${before.requestedSamples} before; ${statistics.after.count}/${after.requestedSamples} after. Failed and missing attempts are excluded, never retried.</p><table><thead><tr><th>Statistic</th><th>Before (ms)</th><th>After (ms)</th><th>Change (ms)</th><th>Change (%)</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.name}</td><td>${format(row.before)}</td><td>${format(row.after)}</td><td>${format(row.change)}</td><td>${row.percent === null ? 'N/A' : format(row.percent)}</td></tr>`).join('')}</tbody></table>`
  return { statistics, summary, svg, html }
}

export const reportSmoke = async (input: string, output: string, commits: { before: string; after: string }) => {
  const results = new Map<string, SmokeResult>()
  const diagnostics: string[] = []
  const duplicates = new Set<string>()
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.name === 'smoke-result.json') {
        try {
          const result = await readJson<SmokeResult>(path)
          if (![commits.before, commits.after].includes(result.commit)) continue
          parseCommitReference(result.harnessCommit)
          if (!/^[0-9a-f]{40}$/.test(result.fixtureCommit)) throw new Error('Invalid smoke fixture commit')
          if (results.has(result.commit)) {
            duplicates.add(result.commit)
            throw new Error(`Duplicate smoke result for ${result.commit}`)
          }
          if (
            result.schemaVersion !== 1 ||
            !Number.isSafeInteger(result.requestedSamples) ||
            result.requestedSamples < 1 ||
            result.requestedSamples > 1000 ||
            !Array.isArray(result.samples)
          )
            throw new Error('Invalid smoke result')
          const seen = new Set<number>()
          for (const sample of result.samples) {
            if (
              !Number.isSafeInteger(sample.index) ||
              sample.index < 0 ||
              sample.index >= result.requestedSamples ||
              seen.has(sample.index) ||
              !['success', 'failed'].includes(sample.status) ||
              !Number.isFinite(sample.elapsedMs) ||
              sample.elapsedMs < 0 ||
              !Array.isArray(sample.tests) ||
              !sample.tests.every((test) => typeof test === 'string') ||
              !Number.isSafeInteger(sample.pending) ||
              sample.pending < 0 ||
              (sample.status === 'success' && !sample.tests.length)
            )
              throw new Error('Invalid smoke sample')
            seen.add(sample.index)
          }
          results.set(result.commit, result)
        } catch (error) {
          diagnostics.push(errorMessage(error))
        }
      }
    }
  }
  await visit(input)
  try {
    if (duplicates.size) throw new Error('Duplicate smoke results cannot be compared')
    const before = results.get(commits.before),
      after = results.get(commits.after)
    if (!before || !after) throw new Error('Missing smoke results for one or both commits')
    const comparison = smokeComparison(before, after)
    await mkdir(join(output, 'charts'), { recursive: true })
    await writeFile(join(output, 'charts/smoke-tests.svg'), comparison.svg)
    const complete = [before, after].every((r) => r.samples.length === r.requestedSamples && r.samples.every((s) => s.status === 'success'))
    return { usable: true, status: complete ? ('success' as const) : ('partial' as const), ...comparison, diagnostics }
  } catch (error) {
    diagnostics.push(errorMessage(error))
    return {
      usable: false,
      status: 'missing' as const,
      summary: `### Smoke test timings\n\nComparison unavailable: ${diagnostics.map(escape).join('; ')}\n`,
      statistics: null,
      html: `<p>Comparison unavailable: ${diagnostics.map(escape).join('; ')}</p>`,
      diagnostics,
    }
  }
}
