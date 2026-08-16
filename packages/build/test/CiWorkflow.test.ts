import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@jest/globals'

const getWorkflowPath = (): string => {
  const currentFilePath = fileURLToPath(import.meta.url)
  const testDir = dirname(currentFilePath)
  return join(testDir, '..', '..', '..', '.github', 'workflows', 'ci.yml')
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
