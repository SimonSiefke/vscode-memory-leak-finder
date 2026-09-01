import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export interface LinuxProcessTreeResourcesFromStartConfig {
  readonly enabled: boolean
  readonly metadataPath: string
  readonly perfOutputPath: string
  readonly sampleOutputPath: string
  readonly samplerPath: string
}

export const isLinuxProcessTreeResourcesFromStart = (measureId: string): boolean => {
  return measureId === 'linux-process-tree-resources-from-start' || measureId === 'linuxProcessTreeResourcesFromStart'
}

const getOutputDirectory = (): string => {
  return join(Root.root, '.vscode-memory-leak-finder-linux-process-tree-resources')
}

export const getConfig = (measureId: string, connectionId: number): LinuxProcessTreeResourcesFromStartConfig => {
  const enabled = isLinuxProcessTreeResourcesFromStart(measureId)
  const outputDirectory = getOutputDirectory()
  return {
    enabled,
    metadataPath: enabled ? join(outputDirectory, `${connectionId}.json`) : '',
    perfOutputPath: enabled ? join(outputDirectory, `${connectionId}.perf.txt`) : '',
    sampleOutputPath: enabled ? join(outputDirectory, `${connectionId}.samples.json`) : '',
    samplerPath: enabled ? join(Root.root, 'packages', 'memory-leak-finder', 'bin', 'linux-process-tree-sampler.js') : '',
  }
}
