import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeJson } from '../src/parts/Io/Io.ts'
import { readyBuildMatrix, recordBuildUpload } from '../src/parts/BuildReadiness/BuildReadiness.ts'
import { executionPlan } from '../src/parts/Architecture/Architecture.ts'
import { benchmarks } from '../src/parts/Manifest/Manifest.ts'
const commits = ['a', 'b', 'c', 'd'].map((x) => x.repeat(40))
const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test('a failed baseline removes dependent jobs while preserving later valid pairs in a version series', async () => {
  const root = await mkdtemp(join(tmpdir(), 'build-readiness-'))
  directories.push(root)
  for (const [index, commit] of commits.entries())
    await writeJson(join(root, `large-build-status-${commit}`, 'status.json'), {
      commit,
      arch: 'x64',
      artifactUploaded: index !== 1,
      status: index === 1 ? 'failed' : 'success',
    })
  const matrix = executionPlan(
    commits,
    benchmarks.filter((b) => b.collector === 'timing'),
  ).matrix
  const ready = await readyBuildMatrix(matrix, root, 'x64')
  expect(ready.matrix.include.length).toBeGreaterThan(0)
  expect(ready.matrix.include.every((job) => job.before === commits[2] && job.after === commits[3])).toBe(true)
  expect(ready.skipped).toHaveLength(matrix.include.length - ready.matrix.include.length)
  expect(ready.diagnostics.join(' ')).toContain(commits[1])
})

test('missing, malformed, or wrong-architecture status records never queue an unusable pair', async () => {
  const root = await mkdtemp(join(tmpdir(), 'build-readiness-'))
  directories.push(root)
  const matrix = executionPlan(
    commits.slice(0, 2),
    benchmarks.filter((b) => b.collector === 'instructions'),
  ).arm_matrix
  await writeJson(join(root, 'large-build-status-wrong-architecture', 'status.json'), {
    commit: commits[0],
    arch: 'x64',
    status: 'success',
  })
  await writeJson(join(root, 'large-build-status-valid', 'status.json'), {
    commit: commits[1],
    arch: 'arm64',
    artifactUploaded: true,
    status: 'success',
  })
  await writeJson(join(root, 'large-build-status-broken', 'status.json'), { status: 'success' })
  const ready = await readyBuildMatrix(matrix, root, 'arm64')
  expect(ready.matrix.include).toEqual([])
  expect(ready.skipped).toHaveLength(matrix.include.length)
  expect(ready.diagnostics.length).toBeGreaterThan(0)
})

test('workflow build failures stay failures and measurement matrices are gated by uploaded build statuses', async () => {
  const source = await readFile(new URL('../../../.github/workflows/large-performance.yml', import.meta.url), 'utf8')
  const job = (name: string) => source.split(`\n  ${name}:\n`)[1]!.split(/\n  [a-z0-9-]+:\n/)[0]!
  for (const name of ['build', 'build-arm']) expect(job(name)).not.toContain('continue-on-error: true')
  expect(job('measure')).toContain('needs: [initialize, ready-x64]')
  expect(job('measure-arm')).toContain('needs: [initialize, ready-arm]')
  expect(job('measure')).toContain('outputs.has_runtime')
  expect(job('measure')).toContain('needs.ready-x64.outputs.matrix')
})

test('an upload failure overrides successful compilation and remains visible to the scheduling gate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'build-upload-'))
  directories.push(root)
  const statusDirectory = join(root, 'large-build-status-candidate')
  await writeJson(join(statusDirectory, 'status.json'), { status: 'success', commit: commits[0], arch: 'x64' })
  await recordBuildUpload(statusDirectory, commits[0]!, false)
  expect(JSON.parse(await readFile(join(statusDirectory, 'status.json'), 'utf8'))).toMatchObject({
    status: 'failed',
    artifactUploaded: false,
  })
  const matrix = executionPlan(
    [commits[0]!, commits[1]!],
    benchmarks.filter((b) => b.collector === 'timing'),
  ).matrix
  expect((await readyBuildMatrix(matrix, root, 'x64')).matrix.include).toEqual([])
})

test('ready-matrix reads frozen identities, confirms uploads and writes a matrix without installing the harness', async () => {
  const { largePerformance } = await import('../src/parts/Main/Main.ts')
  const root = await mkdtemp(join(tmpdir(), 'build-ready-cli-'))
  directories.push(root)
  const manifest = join(root, 'manifest.json')
  const benchmark = { ...benchmarks.find((b) => b.collector === 'timing')!, arch: 'x64' }
  await writeJson(manifest, { schemaVersion: 1, commits: { before: commits[0], after: commits[1] }, samples: 2, benchmarks: [benchmark] })
  for (const commit of commits.slice(0, 2)) {
    const build = join(root, 'statuses', `large-build-status-${commit}`)
    await writeJson(join(build, 'status.json'), { status: 'success', commit, arch: 'x64' })
    await recordBuildUpload(build, commit, true)
  }
  const previous = process.env.GITHUB_OUTPUT
  process.env.GITHUB_OUTPUT = join(root, 'outputs')
  try {
    await largePerformance([
      'ready-matrix',
      '--manifest',
      manifest,
      '--input-dir',
      join(root, 'statuses'),
      '--arch',
      'x64',
      '--output-dir',
      join(root, 'ready'),
    ])
    const outputs = await readFile(process.env.GITHUB_OUTPUT, 'utf8')
    expect(outputs).toContain('has_runtime=true')
    const ready = JSON.parse(await readFile(join(root, 'ready/build-readiness.json'), 'utf8'))
    expect(ready.matrix.include).toHaveLength(1)
    expect(ready.skipped).toEqual([])
    expect(ready.diagnostics).toEqual([])
  } finally {
    if (previous === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = previous
  }
})
