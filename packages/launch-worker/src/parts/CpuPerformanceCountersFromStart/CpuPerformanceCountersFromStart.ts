import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export interface CpuPerformanceCountersFromStartConfig {
  readonly enabled: boolean
  readonly outputPath: string
}

export const isCpuPerformanceCountersFromStart = (measureId: string): boolean => {
  return measureId === 'cpu-performance-counters-from-start' || measureId === 'cpuPerformanceCountersFromStart'
}

export const getOutputPath = (connectionId: number): string => {
  return join(Root.root, '.vscode-memory-leak-finder-cpu-performance-counters', `${connectionId}.txt`)
}

export const getConfig = (measureId: string, connectionId: number): CpuPerformanceCountersFromStartConfig => {
  const enabled = isCpuPerformanceCountersFromStart(measureId)
  return {
    enabled,
    outputPath: enabled ? getOutputPath(connectionId) : '',
  }
}
