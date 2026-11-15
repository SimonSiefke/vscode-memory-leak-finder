import { expect, test } from '@jest/globals'
import { executionPlan, assertNativeBenchmarks } from '../src/parts/Architecture/Architecture.ts'
import { benchmarks } from '../src/parts/Manifest/Manifest.ts'

const commits = ['a'.repeat(40), `simonsiefke/vscode@${'b'.repeat(40)}`]

test.each([2, 3, 100, 256])('native job families cover each case once without exceeding matrix limits (%s revisions)', (count) => {
  const revisions = Array.from({ length: count }, (_, index) => index.toString(16).padStart(40, '0'))
  const plan = executionPlan(revisions, benchmarks)
  for (const matrix of [plan.matrix, plan.arm_matrix, plan.build_matrix, plan.arm_build_matrix])
    expect(matrix.include.length).toBeLessThanOrEqual(256)
  for (const [matrix, arch] of [
    [plan.matrix, 'x64'],
    [plan.arm_matrix, 'arm64'],
  ] as const) {
    const ids = matrix.include.flatMap((job) => job.benchmarks.split(','))
    const expected = benchmarks.filter((b) => b.collector !== 'smoke' && (b.collector === 'instructions') === (arch === 'arm64'))
    for (const benchmark of expected) expect(ids.filter((id) => id === benchmark.id)).toHaveLength(count - 1)
    expect(new Set(ids).size).toBe(expected.length)
  }
})

test('instruction-only follow-ups build only native ARM packages with distinct fork artifact identities', () => {
  const plan = executionPlan(
    commits,
    benchmarks.filter((b) => b.collector === 'instructions'),
  )
  expect(plan.has_x64).toBe(false)
  expect(plan.has_arm).toBe(true)
  expect(plan.build_matrix.include).toEqual([])
  expect(plan.arm_build_matrix.include).toEqual([
    { commit: commits[0], artifact: `${commits[0]}-arm64` },
    { commit: commits[1], artifact: `simonsiefke-vscode-${'b'.repeat(40)}-arm64` },
  ])
  expect(plan.arm_matrix.include[0]).toMatchObject({
    beforeArtifact: `${commits[0]}-arm64`,
    afterArtifact: `simonsiefke-vscode-${'b'.repeat(40)}-arm64`,
  })
})

test('smoke retains the x64 build and never enters a runtime measurement matrix', () => {
  const plan = executionPlan(
    commits,
    benchmarks.filter((b) => b.collector === 'smoke'),
  )
  expect(plan.has_x64).toBe(true)
  expect(plan.has_runtime).toBe(false)
  expect(plan.has_arm).toBe(false)
  expect(plan.matrix.include).toEqual([])
  expect(plan.arm_matrix.include).toEqual([])
})

test('native measurement guard rejects wrong-architecture and mixed jobs while allowing legacy local runs', () => {
  const instruction = { ...benchmarks.find((b) => b.collector === 'instructions')!, arch: 'arm64' as const }
  const timing = { ...benchmarks.find((b) => b.collector === 'timing')!, arch: 'x64' as const }
  expect(() => assertNativeBenchmarks([instruction], 'linux', 'x64')).toThrow('arm64')
  expect(() => assertNativeBenchmarks([instruction, timing], 'linux', 'arm64')).toThrow('x64')
  expect(() => assertNativeBenchmarks([instruction], 'linux', 'arm64')).not.toThrow()
  expect(() => assertNativeBenchmarks([timing], 'darwin', 'x64')).toThrow('Linux')
  const { arch: _arch, ...legacy } = instruction
  expect(() => assertNativeBenchmarks([legacy], 'linux', 'x64')).not.toThrow()
})

test('workflow keeps native instruction builds and measurements on ARM and waits for their reports', async () => {
  const { readFile } = await import('node:fs/promises')
  const workflow = await readFile(new URL('../../../.github/workflows/large-performance.yml', import.meta.url), 'utf8')
  const job = (name: string) => workflow.split(`\n  ${name}:\n`)[1]!.split(/\n  [a-z0-9-]+:\n/)[0]!
  expect(job('build-arm')).toContain('runs-on: ubuntu-24.04-arm')
  expect(job('build-arm')).toContain('outputs.arm_build_matrix')
  expect(job('measure-arm')).toContain('runs-on: ubuntu-24.04-arm')
  expect(job('measure-arm')).toContain('needs: [initialize, ready-arm]')
  expect(job('measure-arm')).toContain('needs.ready-arm.outputs.matrix')
  expect(job('measure-arm')).toContain('name: large-result-arm64-')
  expect(job('measure')).toContain('runs-on: ubuntu-24.04\n')
  expect(job('report')).toContain('needs: [initialize, build, build-arm, measure, measure-arm, smoke]')
})

test('matrix CLI freezes architecture and emits ARM-only outputs for an instruction follow-up', async () => {
  const { mkdtemp, readFile, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { largePerformance } = await import('../src/parts/Main/Main.ts')
  const directory = await mkdtemp(join(tmpdir(), 'native-matrix-'))
  const previous = process.env.GITHUB_OUTPUT
  process.env.GITHUB_OUTPUT = join(directory, 'outputs')
  try {
    await largePerformance([
      'matrix',
      '--before-commit',
      commits[0]!,
      '--after-commit',
      commits[1]!,
      '--measures',
      'instructions',
      '--startup-samples',
      '200',
      '--output-dir',
      directory,
    ])
    const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'))
    expect(manifest.benchmarks.every((b: any) => b.arch === 'arm64')).toBe(true)
    expect(manifest.benchmarks.filter((b: any) => b.startup).every((b: any) => b.samples === 200)).toBe(true)
    const outputs = Object.fromEntries(
      (await readFile(process.env.GITHUB_OUTPUT!, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => [
          line.slice(0, line.indexOf('=')),
          ['smoke_harness'].includes(line.slice(0, line.indexOf('=')))
            ? line.slice(line.indexOf('=') + 1)
            : JSON.parse(line.slice(line.indexOf('=') + 1)),
        ]),
    )
    expect(outputs.has_arm).toBe(true)
    expect(outputs.has_x64).toBe(false)
    expect(outputs.has_runtime).toBe(false)
    expect(outputs.arm_matrix.include).toHaveLength(manifest.benchmarks.length)
    expect(outputs.arm_build_matrix.include).toHaveLength(2)
    expect(outputs.matrix.include).toEqual([])
    expect(outputs.build_matrix.include).toEqual([])
  } finally {
    if (previous === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = previous
    await rm(directory, { recursive: true, force: true })
  }
})
