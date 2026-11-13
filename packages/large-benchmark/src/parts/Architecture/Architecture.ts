import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { seriesMatrix } from '../Series/Series.ts'
import type { Architecture, Benchmark } from '../Types/Types.ts'

export const collectorArchitecture = (benchmark: Benchmark): Architecture => (benchmark.collector === 'instructions' ? 'arm64' : 'x64')
export const buildArtifact = (commit: string, arch: Architecture): string =>
  `${parseCommitReference(commit).artifact}${arch === 'arm64' ? '-arm64' : ''}`

// Each architecture gets a separate Actions matrix, including for 256-revision histories.
export const executionPlan = (commits: string[], benchmarks: Benchmark[]) => {
  const matrixFor = (arch: Architecture) => {
    const selected = benchmarks.filter((b) => b.collector !== 'smoke' && collectorArchitecture(b) === arch)
    return {
      include: (selected.length ? seriesMatrix(commits, selected).include : []).map((pair) => ({
        ...pair,
        beforeArtifact: buildArtifact(pair.before, arch),
        afterArtifact: buildArtifact(pair.after, arch),
      })),
    }
  }
  const buildsFor = (arch: Architecture) => ({
    include: benchmarks.some((b) => collectorArchitecture(b) === arch)
      ? [...new Set(commits)].map((commit) => ({ commit, artifact: buildArtifact(commit, arch) }))
      : [],
  })
  const matrix = matrixFor('x64')
  const arm_matrix = matrixFor('arm64')
  const build_matrix = buildsFor('x64')
  const arm_build_matrix = buildsFor('arm64')
  return {
    matrix,
    arm_matrix,
    build_matrix,
    arm_build_matrix,
    has_runtime: matrix.include.length > 0,
    has_x64: build_matrix.include.length > 0,
    has_arm: arm_build_matrix.include.length > 0,
  }
}

export const assertNativeBenchmarks = (benchmarks: Benchmark[], platform = process.platform, arch = process.arch): void => {
  if (platform !== 'linux' || !['x64', 'arm64'].includes(arch)) throw new Error('Measurements require native Linux x64 or arm64')
  for (const benchmark of benchmarks)
    if (benchmark.arch && benchmark.arch !== arch) throw new Error(`${benchmark.id} requires native ${benchmark.arch}, received ${arch}`)
}
