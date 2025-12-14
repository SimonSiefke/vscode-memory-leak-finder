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

  console.log(`Found ${commits.length} commits, starting bisect...`)

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

    console.log(`Testing commit ${mid + 1}/${commits.length}: ${commitHash}`)

    try {
      const result = await RunTests.runTests({
        ...options,
        commit: commitHash,
      })

      if (result.type === 'error') {
        console.log(`Test failed for commit ${commitHash}: ${result.prettyError}`)
        return {
          type: 'failed-test',
        }
      }

      const hasLeak = result.leaked > 0

      if (hasLeak) {
        lastLeakingCommit = commitHash
        console.log(`Leak detected in commit ${commitHash}, searching newer commits...`)
        right = mid - 1
      } else {
        console.log(`No leak detected in commit ${commitHash}, searching older commits...`)
        left = mid + 1
      }
    } catch (error) {
      console.log(`Test failed for commit ${commitHash}: ${error}`)
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

