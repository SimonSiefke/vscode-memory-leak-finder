import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import * as FetchCommits from '../FetchCommits/FetchCommits.ts'
import type { BisectResult } from '../BisectResult/BisectResult.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

const performBisect = async (options: RunTestsOptions): Promise<BisectResult> => {
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

export const runTests = async (options: RunTestsOptions): Promise<RunTestsResult> => {
  if (options.bisect) {
    if (!options.checkLeaks) {
      throw new Error('--bisect requires --check-leaks to be enabled')
    }
    return performBisect(options)
  }

  return RunTestsWithCallback.runTestsWithCallback({
    root: options.root,
    cwd: options.cwd,
    filterValue: options.filterValue,
    headlessMode: options.headlessMode,
    color: options.color,
    checkLeaks: options.checkLeaks,
    runSkippedTestsAnyway: options.runSkippedTestsAnyway,
    recordVideo: options.recordVideo,
    runs: options.runs,
    measure: options.measure,
    measureAfter: options.measureAfter,
    measureNode: options.measureNode,
    timeouts: options.timeouts,
    timeoutBetween: options.timeoutBetween,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    ide: options.ide,
    ideVersion: options.ideVersion,
    vscodePath: options.vscodePath,
    vscodeVersion: options.vscodeVersion,
    commit: options.commit,
    setupOnly: options.setupOnly,
    inspectSharedProcess: options.inspectSharedProcess,
    inspectExtensions: options.inspectExtensions,
    inspectPtyHost: options.inspectPtyHost,
    enableExtensions: options.enableExtensions,
    continueValue: options.continueValue,
    inspectPtyHostPort: options.inspectPtyHostPort,
    inspectSharedProcessPort: options.inspectSharedProcessPort,
    inspectExtensionsPort: options.inspectExtensionsPort,
    enableProxy: options.enableProxy,
    useProxyMock: options.useProxyMock,
    callback,
    addDisposable: Disposables.add,
    clearDisposables: Disposables.disposeAll,
  })
}
