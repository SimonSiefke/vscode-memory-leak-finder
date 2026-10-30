import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import type { Benchmark } from '../Types/Types.ts'
import type { StableRelease } from '../VersionRange/VersionRange.ts'

export interface CommitPair {
  id: string
  before: string
  after: string
}

export interface SeriesManifest {
  schemaVersion: 2
  commits: string[]
  samples: number
  benchmarks: Benchmark[]
  releases?: StableRelease[]
}

export const validateCommits = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length < 2 || value.length > 256)
    throw new Error('commits must be a JSON array of 2 to 256 full SHAs or owner/vscode@SHA references, ordered oldest to newest')
  if (!value.every((reference) => typeof reference === 'string')) throw new Error('commits must contain only commit references')
  const parsed = value.map((reference: string) => parseCommitReference(reference))
  const commits = parsed.map((commit) => commit.reference)
  if (new Set(parsed.map((commit) => commit.artifact)).size !== commits.length) throw new Error('commits must be unique')
  return commits
}

export const parseCommits = (json: string): string[] => {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('commits must be a JSON array of full SHAs or owner/vscode@SHA references')
  }
  return validateCommits(value)
}

export const commitPairs = (commits: string[]): CommitPair[] =>
  commits.slice(1).map((after, index) => ({ id: `pair-${index + 1}`, before: commits[index]!, after }))

// Group benchmarks when necessary so a long series stays within Actions' 256-job matrix limit.
export const seriesMatrix = (commits: string[], benchmarks: Benchmark[]) => {
  const pairs = commitPairs(validateCommits(commits))
  if (!benchmarks.length) throw new Error('At least one benchmark is required')
  const groupsPerPair = Math.min(benchmarks.length, Math.floor(256 / pairs.length))
  const groupSize = Math.ceil(benchmarks.length / groupsPerPair)
  return {
    include: pairs.flatMap((pair) =>
      Array.from({ length: Math.ceil(benchmarks.length / groupSize) }, (_, index) => ({
        ...pair,
        group: index + 1,
        benchmarks: benchmarks
          .slice(index * groupSize, (index + 1) * groupSize)
          .map((benchmark) => benchmark.id)
          .join(','),
      })),
    ),
  }
}
