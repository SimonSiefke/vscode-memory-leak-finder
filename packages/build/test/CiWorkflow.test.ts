import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@jest/globals'

const getWorkflowPath = (workflowName = 'ci.yml'): string => {
  const currentFilePath = fileURLToPath(import.meta.url)
  const testDir = dirname(currentFilePath)
  return join(testDir, '..', '..', '..', '.github', 'workflows', workflowName)
}

test('ci retains every run before starting the measure matrix', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).not.toContain('\nconcurrency:')
})

test('ci measure failures do not block the Pages deployment', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain(`      - name: Run headless test (check leaks, \${{ matrix.measure.name }})
        timeout-minutes: 350
        continue-on-error: true
        uses: coactions/setup-xvfb@v1`)
  expect(workflow).toContain(`  deploy:
    if: \${{ always() && needs.ci.result == 'success' && needs.ci-linux-charts.result == 'success' }}`)
  expect(workflow).toContain(`    concurrency:
      group: github-pages-deploy
      cancel-in-progress: false`)
  expect(workflow).toContain(`      - name: Check whether this run is for the latest main commit
        id: latest-main`)
  expect(workflow).toContain('git ls-remote "https://github.com/${GITHUB_REPOSITORY}.git" refs/heads/main')
  expect(workflow).toContain('if [ -z "$latest_sha" ]; then')
  expect(workflow).toContain("        if: steps.latest-main.outputs.is-latest == 'true'\n        id: deployment")
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

test('ci measures frontend object URLs for 37 runs and downloads the results for Pages', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain('args: --measure object-url-count --runs 37 --run-skipped-tests-anyway')
  expect(workflow).not.toContain('args: --measure object-url-count --runs 37 --restart-between')
  expect(workflow).toContain('name: vscode-memory-leak-finder-results-linux-object-url-count')
  expect(workflow).toContain('path: ./vscode-memory-leak-finder-results-linux-object-url-count')
})

test('ci measures total array length and downloads the results for Pages charts', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  expect(workflow).toContain(`          - name: array-element-count
            args: --measure array-element-count`)
  expect(workflow).toContain(`      - uses: actions/download-artifact@v8
        continue-on-error: true
        with:
          name: vscode-memory-leak-finder-results-linux-array-element-count
          path: ./vscode-memory-leak-finder-results-linux-array-element-count`)
  expect(workflow).toContain(`      - name: Delete individual artifacts
        uses: geekyeggo/delete-artifact@v6
        continue-on-error: true
        with:
          name: vscode-memory-leak-finder-results-linux-array-element-count`)
})

test('ci collects Node-compatible measures for the extension host and verifies its Pages overview', async () => {
  const workflow = await readFile(getWorkflowPath(), 'utf8')

  for (const measure of ['array-count', 'function-count', 'pending-promise-count', 'object-count']) {
    expect(workflow).toContain(`          - name: ${measure}-extensions\n            args: --measure ${measure} --inspect-extensions`)
  }
  for (const measure of ['string-object-count', 'string-object-bytes']) {
    expect(workflow).toContain(`          - name: ${measure}-extensions\n            args: --measure ${measure} --inspect-extensions`)
  }
  expect(workflow).not.toContain('name: detached-dom-node-count-extensions')
  expect(workflow).toContain('pattern: vscode-memory-leak-finder-results-linux-*-extensions')
  expect(workflow).toContain('path: ./vscode-memory-leak-finder-results-linux-extensions')
  expect(workflow).toContain('name: Delete extension-host artifact (array-count-extensions)')
  expect(workflow).toContain('name: Delete extension-host artifact (function-count-extensions)')
  expect(workflow).toContain("grep -q './array-count/index.html' .vscode-charts/extension-host/index.html")
  expect(workflow).toContain("grep -q './function-count/index.html' .vscode-charts/extension-host/index.html")
})

test.each(['string-object-count', 'string-object-bytes'])(
  'ci collects %s with the standard test selection and includes its artifact in Pages charts',
  async (measure) => {
    const workflow = await readFile(getWorkflowPath(), 'utf8')
    expect(workflow).toContain(`          - name: ${measure}
            args: --measure ${measure}`)
    const download = `      - uses: actions/download-artifact@v8
        continue-on-error: true
        with:
          name: vscode-memory-leak-finder-results-linux-${measure}
          path: ./vscode-memory-leak-finder-results-linux-${measure}`
    const cleanup = `      - name: Delete individual artifacts
        uses: geekyeggo/delete-artifact@v6
        continue-on-error: true
        with:
          name: vscode-memory-leak-finder-results-linux-${measure}`
    expect(workflow).toContain(download)
    expect(workflow).toContain(cleanup)
    expect(workflow.indexOf(download)).toBeLessThan(workflow.indexOf('      - name: Merge all measure results'))
    expect(workflow.indexOf(cleanup)).toBeGreaterThan(workflow.indexOf('      - name: Upload merged artifact'))
  },
)

test('Windows handles runs separately from ci and pr so cancellation cannot affect their results', async () => {
  for (const workflowName of ['ci.yml', 'pr.yml']) {
    const workflow = await readFile(getWorkflowPath(workflowName), 'utf8')

    expect(workflow).not.toContain('windows-handles')
  }
})

test('the optional Windows handles workflow retains push and pull request runs and uploads charts', async () => {
  const workflow = await readFile(getWorkflowPath('windows-handles.yml'), 'utf8')

  expect(workflow).toContain(`on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main`)
  expect(workflow).not.toContain('\nconcurrency:')
  expect(workflow).toContain(`  windows-handles:
    runs-on: windows-2022
    continue-on-error: true`)
  expect(workflow).toContain(
    'node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure windows-handles --runs 37 --restart-between --run-skipped-tests-anyway',
  )
  expect(workflow).toContain('name: vscode-memory-leak-finder-results-windows-handles')
  expect(workflow).toContain('name: vscode-memory-leak-finder-charts-windows-handles')
  expect(workflow).toContain('name: Generate Windows handles charts')
})
