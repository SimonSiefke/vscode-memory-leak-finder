import { expect, test } from '@jest/globals'
import { basename } from 'node:path'
import * as LinuxProcessTreeResourcesFromStart from '../src/parts/LinuxProcessTreeResourcesFromStart/LinuxProcessTreeResourcesFromStart.ts'

test('enables launch-time collection for both public measure spellings', () => {
  const config = LinuxProcessTreeResourcesFromStart.getConfig('linux-process-tree-resources-from-start', 7)
  expect(config.enabled).toBe(true)
  expect(basename(config.metadataPath)).toBe('7.json')
  expect(basename(config.perfOutputPath)).toBe('7.perf.txt')
  expect(LinuxProcessTreeResourcesFromStart.getConfig('linuxProcessTreeResourcesFromStart', 7).enabled).toBe(true)
})

test('does not configure launch-time collection for other measures', () => {
  expect(LinuxProcessTreeResourcesFromStart.getConfig('linux-process-tree-resources', 7)).toEqual({
    enabled: false,
    metadataPath: '',
    perfOutputPath: '',
  })
})
