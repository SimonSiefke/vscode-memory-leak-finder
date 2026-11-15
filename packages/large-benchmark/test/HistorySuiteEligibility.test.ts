import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { repositoryRoot } from '../src/parts/Prepare/Prepare.ts'

test('every historical core scenario runs under the Linux CI eligibility policy', async () => {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        Object.defineProperty(process, 'platform', { value: 'linux' })
        const { historicalCoreTests } = await import('./packages/large-benchmark/src/parts/CountHistory/CountHistory.ts')
        const { testExclusionReason } = await import('./packages/test-worker/src/parts/TestEligibility/TestEligibility.ts')
        const excluded = []
        for (const name of historicalCoreTests) {
          const file = './packages/e2e/src/' + name + '.ts'
          const scenario = await import(file)
          const reason = testExclusionReason(scenario, file, { isGithubActions: true })
          if (reason) excluded.push({ name, reason })
        }
        console.log(JSON.stringify(excluded))
      `,
    ],
    { cwd: repositoryRoot },
  )
  expect(JSON.parse(stdout)).toEqual([])
})
