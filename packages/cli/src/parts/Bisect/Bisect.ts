import * as FetchCommits from '../FetchCommits/FetchCommits.ts'
import * as RunTest from '../RunTest/RunTest.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import type { StartRunningOptions } from '../StartRunning/StartRunningOptions.ts'

export interface BisectResult {
  type: 'success' | 'failed-test' | 'not-found'
  commit?: string
}

export const bisect = async (options: StartRunningOptions): Promise<BisectResult> => {
  if (!options.checkLeaks) {
    await Stdout.write('Error: --bisect requires --check-leaks to be enabled\n')
    process.exit(1)
  }

  await Stdout.write('Fetching commits from VS Code API...\n')
  let commits
  try {
    commits = await FetchCommits.fetchCommits()
  } catch (error) {
    await Stdout.write(`Failed to fetch commits: ${error}\n`)
    return {
      type: 'failed-test',
    }
  }

  if (commits.length === 0) {
    await Stdout.write('No commits found\n')
    return {
      type: 'not-found',
    }
  }

  await Stdout.write(`Found ${commits.length} commits, starting bisect...\n`)

  let left = 0
  let right = commits.length - 1
  let lastLeakingCommit: string | undefined

  const rpc = await RunTest.prepare()

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const commit = commits[mid]
    const commitHash = commit.commit

    await Stdout.write(`Testing commit ${mid + 1}/${commits.length}: ${commitHash}\n`)

    try {
      const result = await rpc.invoke(TestWorkerCommandType.RunTests, {
        root: options.cwd,
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
        commit: commitHash,
        setupOnly: options.setupOnly,
        workers: options.workers,
        continueValue: options.continueValue,
        inspectSharedProcess: options.inspectSharedProcess,
        inspectExtensions: options.inspectExtensions,
        inspectPtyHost: options.inspectPtyHost,
        enableExtensions: options.enableExtensions,
        inspectPtyHostPort: options.inspectPtyHostPort,
        inspectSharedProcessPort: options.inspectSharedProcessPort,
        inspectExtensionsPort: options.inspectExtensionsPort,
        enableProxy: options.enableProxy,
        useProxyMock: options.useProxyMock,
      })

      if (result.type === 'error') {
        await Stdout.write(`Test failed for commit ${commitHash}: ${result.prettyError}\n`)
        return {
          type: 'failed-test',
        }
      }

      const hasLeak = result.leaked > 0

      if (hasLeak) {
        lastLeakingCommit = commitHash
        await Stdout.write(`Leak detected in commit ${commitHash}, searching newer commits...\n`)
        right = mid - 1
      } else {
        await Stdout.write(`No leak detected in commit ${commitHash}, searching older commits...\n`)
        left = mid + 1
      }
    } catch (error) {
      await Stdout.write(`Test failed for commit ${commitHash}: ${error}\n`)
      return {
        type: 'failed-test',
      }
    }
  }

  await rpc.dispose()

  if (lastLeakingCommit) {
    await Stdout.write(`\nBisect completed successfully!\n`)
    await Stdout.write(`Memory leak regression introduced in commit: ${lastLeakingCommit}\n`)
    return {
      type: 'success',
      commit: lastLeakingCommit,
    }
  } else {
    await Stdout.write(`\nBisect completed but no leaking commit found in the tested range.\n`)
    return {
      type: 'not-found',
    }
  }
}
