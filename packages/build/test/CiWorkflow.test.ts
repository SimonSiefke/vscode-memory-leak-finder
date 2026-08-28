import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@jest/globals'

const getWorkflowPath = (workflowName = 'ci.yml'): string => {
  const currentFilePath = fileURLToPath(import.meta.url)
  const testDir = dirname(currentFilePath)
  return join(testDir, '..', '..', '..', '.github', 'workflows', workflowName)
}

test('ci cancels superseded runs before starting the measure matrix', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain(`concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true`)
})

test('ci measure failures do not block the Pages deployment', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain(`      - name: Run headless test (check leaks, \${{ matrix.measure.name }})
        timeout-minutes: 350
        continue-on-error: true
        uses: coactions/setup-xvfb@v1`)
  expect(workflow).toContain(`  deploy:
    if: \${{ always() && needs.ci.result == 'success' && needs.ci-linux-charts.result == 'success' }}`)
})

test('pr bounds the Memory City smoke test without the setup-xvfb action wrapper', async () => {
  const workflow = await readFile(getWorkflowPath('pr.yml'), 'utf8')

  expect(workflow).toContain(`      - name: Run Memory City smoke test
        if: matrix.os == 'ubuntu-24.04'
        run: timeout 5m xvfb-run --auto-servernum node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure memory-city --only ^editor-open.ts --workers 1`)
})

test('ci runs promises-with-stack-trace in two shards and downloads both results', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain('name: promises-with-stack-trace-shard-1')
  expect(workflow).toContain('--measure promises-with-stack-trace --runs 37 --restart-between --run-skipped-tests-anyway --shard=1/2')
  expect(workflow).toContain('name: promises-with-stack-trace-shard-2')
  expect(workflow).toContain('--measure promises-with-stack-trace --runs 37 --restart-between --run-skipped-tests-anyway --shard=2/2')
  expect(workflow).toContain('name: vscode-memory-leak-finder-results-linux-promises-with-stack-trace-shard-1')
  expect(workflow).toContain('name: vscode-memory-leak-finder-results-linux-promises-with-stack-trace-shard-2')
})

test('pr exercises and validates merging the two promises-with-stack-trace shards', async () => {
  const workflow = await readFile(getWorkflowPath('pr.yml'), 'utf8')

  expect(workflow).toContain('shard: [1, 2]')
  expect(workflow).toContain('--shard=${{ matrix.shard }}/2')
  expect(workflow).toContain('pr-promises-with-stack-trace-merge:')
  expect(workflow).toContain('test "$merged_count" -eq "$((first_count + second_count))"')
})
