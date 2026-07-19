import { expect, test } from '@jest/globals'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const getWorkflow = async (): Promise<string> => {
  const testDirectory = dirname(fileURLToPath(import.meta.url))
  return readFile(join(testDirectory, '..', '..', '..', '.github', 'workflows', 'editor-performance.yml'), 'utf8')
}

test('editor performance workflow measures both revisions in every replica', async () => {
  const workflow = await getWorkflow()

  expect(workflow).toContain('baseline_sha:')
  expect(workflow).toContain('candidate_sha:')
  expect(workflow).toContain('scenario:')
  expect(workflow).toContain('tier:')
  expect(workflow).toContain("replicas='[0,1,2]'")
  expect(workflow).toContain("replicas='[0,1,2,3,4]'")
  expect(workflow).toContain('for commit in "$BASELINE_SHA" "$CANDIDATE_SHA"')
  expect(workflow).toContain('node packages/performance-lab/src/main.ts compare')
  expect(workflow).toContain('--collect-work')
  expect(workflow).toContain('node packages/performance-lab/src/main.ts aggregate')
  expect(workflow).not.toContain('cli_args:')
  expect(workflow).not.toContain('measure-base:')
  expect(workflow).not.toContain('measure-candidate:')
})

test('editor performance workflow runs scheduled identical-build calibration', async () => {
  const workflow = await getWorkflow()

  expect(workflow).toContain("CANDIDATE_SHA=\"$BASELINE_SHA\"")
  expect(workflow).toContain('REQUESTED_TIER=confirmation')
  expect(workflow).toContain('perf_event_paranoid=-1')
  expect(workflow).toContain('--cpu-list "$cpu_list"')
})
