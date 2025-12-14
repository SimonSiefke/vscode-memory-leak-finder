import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import type { BisectResult } from '../BisectResult/BisectResult.ts'
import * as FetchCommits from '../FetchCommits/FetchCommits.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as Disposables from '../Disposables/Disposables.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

export const performBisect = async (options: RunTestsOptions): Promise<BisectResult> => {
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

  let left = 0
  let right = commits.length - 1
  let lastLeakingCommit: string | undefined

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const commit = commits[mid]
    const commitHash = commit.commit

    console.log(`Testing commit ${mid + 1}/${commits.length}: ${commitHash}`)

    try {
      const result = await RunTestsWithCallback.runTestsWithCallback({
        ...options,
        commit: commitHash,
        callback,
        addDisposable: Disposables.add,
        clearDisposables: Disposables.disposeAll,
      })

      if (result.type === 'error') {
        console.log(`Test failed for commit ${commitHash}: ${result.prettyError}`)
        return {
          type: 'failed-test',
        }
      }

      if (result.type !== 'success') {
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
