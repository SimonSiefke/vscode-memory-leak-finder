import { expect, test } from '@jest/globals'
import * as LinuxProcessTreeResourcesFromStart from '../src/parts/LinuxProcessTreeResourcesFromStart/LinuxProcessTreeResourcesFromStart.ts'

test('enables launch-time collection for both public measure spellings', () => {
  expect(LinuxProcessTreeResourcesFromStart.getConfig('linux-process-tree-resources-from-start', 7)).toMatchObject({
    enabled: true,
    metadataPath: expect.stringContaining('/7.json'),
    perfOutputPath: expect.stringContaining('/7.perf.txt'),
  })
  expect(LinuxProcessTreeResourcesFromStart.getConfig('linuxProcessTreeResourcesFromStart', 7).enabled).toBe(true)
})

test('does not configure launch-time collection for other measures', () => {
  expect(LinuxProcessTreeResourcesFromStart.getConfig('linux-process-tree-resources', 7)).toEqual({
    enabled: false,
    metadataPath: '',
    perfOutputPath: '',
  })
})
