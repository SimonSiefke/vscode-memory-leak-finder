import type { BisectResult } from '../BisectResult/BisectResult.ts'
import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import type { RunTestsSuccessResult } from '../RunTestsSuccessResult/RunTestsSuccessResult.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as FetchCommits from '../FetchCommits/FetchCommits.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

export const performBisect = async (options: RunTestsOptions): Promise<BisectResult> => {
  let commits
  try {
    commits = await FetchCommits.fetchCommits(options.platform, options.arch, options.updateUrl)
  } catch {
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
        addDisposable: Disposables.add,
        callback,
        clearDisposables: Disposables.disposeAll,
        commit: '',
        insidersCommit: commitHash,
      })

      if (result.type === 'error') {
        console.log(`Test failed for commit ${commitHash}: ${result.prettyError}`)
        return {
          type: 'failed-test',
        }
      }

      // Type guard: after checking for 'error', result must be 'success' (RunTestsSuccessResult)
      // since RunTestsWithCallback doesn't return BisectResult
      if (result.type !== 'success') {
        return {
          type: 'failed-test',
        }
      }

      const successResult = result as RunTestsSuccessResult
      const hasLeak = successResult.leaked > 0

      // Commits are ordered from newest (index 0) to oldest (index n-1)
      // We want to find the newest commit that has a leak (first chronologically)
      if (hasLeak) {
        lastLeakingCommit = commitHash
        console.log(`Leak detected in commit ${commitHash}, searching older commits to find first leak...`)
        left = mid + 1
      } else {
        console.log(`No leak detected in commit ${commitHash}, searching newer commits...`)
        right = mid - 1
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
      commit: lastLeakingCommit,
      type: 'success',
    }
  } else {
    return {
      type: 'not-found',
    }
  }
}
