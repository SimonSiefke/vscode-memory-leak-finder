import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import type { Dynamic } from '../Types/Types.ts'
import type { ProcessTreeSamplerResult } from '../LinuxProcessTreeResources/LinuxProcessTreeResources.ts'
import * as LinuxProcessTreeResourceResult from '../LinuxProcessTreeResources/LinuxProcessTreeResourceResult.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'

interface State {
  readonly connectionId: number
  metadata?: Metadata
  readonly pid: number
}

interface Metadata {
  readonly command: readonly string[]
  readonly perfOutputPath: string
  readonly perfPid: number
  readonly sampleOutputPath: string
  readonly samplerPid: number
}

const PollInterval = 50
const StopTimeout = 5000

export const id = MeasureId.LinuxProcessTreeResourcesFromStart

export const targets: readonly Dynamic[] = []

const getMetadataPath = (connectionId: number): string => {
  return join(Root.root, '.vscode-memory-leak-finder-linux-process-tree-resources', `${connectionId}.json`)
}

const readMetadata = async (connectionId: number): Promise<Metadata> => {
  try {
    const value = JSON.parse(await readFile(getMetadataPath(connectionId), 'utf8'))
    if (
      !Array.isArray(value.command) ||
      typeof value.perfOutputPath !== 'string' ||
      typeof value.perfPid !== 'number' ||
      typeof value.sampleOutputPath !== 'string' ||
      typeof value.samplerPid !== 'number'
    ) {
      throw new Error('metadata is incomplete')
    }
    return value
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`
    throw new Error(`Failed to read Linux process-tree resource metadata: ${message}`)
  }
}

const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error instanceof Error && 'code' in error && error.code === 'EPERM'
  }
}

const readSamplerResult = async (path: string): Promise<ProcessTreeSamplerResult> => {
  const start = Date.now()
  while (true) {
    try {
      const value = JSON.parse(await readFile(path, 'utf8'))
      if (typeof value.error === 'string') {
        throw new Error(value.error)
      }
      if (Array.isArray(value.samples) && typeof value.droppedSampleCount === 'number') {
        return value
      }
    } catch (error) {
      const retryable = error instanceof SyntaxError || (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      if (!retryable) {
        throw error
      }
    }
    if (Date.now() - start > StopTimeout) {
      throw new Error(`Timed out waiting for process-tree samples at ${path}`)
    }
    await setTimeout(PollInterval)
  }
}

export const create = ({ connectionId, pid }: { connectionId: number; pid: number }) => {
  return [
    {
      connectionId,
      pid,
    } satisfies State,
  ]
}

export const start = async (state: State) => {
  if (process.platform !== 'linux') {
    throw new Error('linux-process-tree-resources-from-start is only supported on Linux')
  }
  const metadata = await readMetadata(state.connectionId)
  if (!isAlive(metadata.perfPid)) {
    throw new Error(`The launch-time perf process ${metadata.perfPid} is not running`)
  }
  if (!isAlive(metadata.samplerPid)) {
    throw new Error(`The launch-time process-tree sampler ${metadata.samplerPid} is not running`)
  }
  state.metadata = metadata
  return {
    command: metadata.command,
    perfPid: metadata.perfPid,
    pid: state.pid,
    samplerPid: metadata.samplerPid,
  }
}

export const stop = async (state: State) => {
  const metadata = state.metadata || (await readMetadata(state.connectionId))
  if (isAlive(metadata.samplerPid)) {
    process.kill(metadata.samplerPid, 'SIGTERM')
  }
  const [perfRawOutput, samplerResult] = await Promise.all([
    readFile(metadata.perfOutputPath, 'utf8'),
    readSamplerResult(metadata.sampleOutputPath),
  ])
  return LinuxProcessTreeResourceResult.createResultFromSampler(perfRawOutput, samplerResult, 'fromStart')
}

export const releaseResources = async (state: State) => {
  const metadata = state.metadata
  if (metadata && isAlive(metadata.samplerPid)) {
    process.kill(metadata.samplerPid, 'SIGTERM')
  }
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  return after
}

export const isLeak = () => {
  return false
}

export const summary = LinuxProcessTreeResourceResult.formatSummary
