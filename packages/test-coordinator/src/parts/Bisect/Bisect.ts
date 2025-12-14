import type { BisectOptions } from '../BisectOptions/BisectOptions.ts'
import type { BisectResult } from '../BisectResult/BisectResult.ts'
import * as FetchCommits from '../FetchCommits/FetchCommits.ts'
import * as RunTests from '../RunTests/RunTests.ts'

export const bisect = async (options: BisectOptions): Promise<BisectResult> => {
  let commits
  try {
    commits = await FetchCommits.fetchCommits()
  } catch (error) {
    return {
      type: 'failed-test',
    }
  }

  if (commits.length === 0) {
    return {
      type: 'not-found',
    }
  }

  return performBisect(commits, options)
}

const performBisect = async (
  commits: Array<{ commit: string }>,
  options: BisectOptions,
): Promise<BisectResult> => {
  let left = 0
  let right = commits.length - 1
  let lastLeakingCommit: string | undefined

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const commit = commits[mid]
    const commitHash = commit.commit

    try {
      const result = await RunTests.runTests({
        ...options,
        commit: commitHash,
      })

      if (result.type === 'error') {
        return {
          type: 'failed-test',
        }
      }

      const hasLeak = result.leaked > 0

      if (hasLeak) {
        lastLeakingCommit = commitHash
        right = mid - 1
      } else {
        left = mid + 1
      }
    } catch (error) {
      return {
        type: 'failed-test',
      }
    }
  }

  if (lastLeakingCommit) {
    return {
      type: 'success',
      commit: lastLeakingCommit,
    }
  } else {
    return {
      type: 'not-found',
    }
  }
}

