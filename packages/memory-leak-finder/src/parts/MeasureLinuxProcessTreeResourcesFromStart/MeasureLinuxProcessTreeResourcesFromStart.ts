import type { MeasurementHandle } from '@vscode-memory-leak-finder/linux-process-tree-worker'
import * as LinuxProcessTreeWorker from '@vscode-memory-leak-finder/linux-process-tree-worker'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'

interface Metadata {
  readonly command: readonly string[]
  readonly measurement: MeasurementHandle
  readonly perfPid: number
}

interface State {
  readonly connectionId: number
  measurement: MeasurementHandle | undefined
  readonly pid: number
}

export const id = MeasureId.LinuxProcessTreeResourcesFromStart

export const targets: readonly Dynamic[] = []

const getMetadataPath = (connectionId: number): string => {
  return join(Root.root, '.vscode-memory-leak-finder-linux-process-tree-resources', `${connectionId}.json`)
}

const readMetadata = async (connectionId: number): Promise<Metadata> => {
  try {
    const value = JSON.parse(await readFile(getMetadataPath(connectionId), 'utf8'))
    if (!Array.isArray(value.command) || typeof value.measurement !== 'object' || typeof value.perfPid !== 'number') {
      throw new Error('metadata is incomplete')
    }
    return value
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`
    throw new Error(`Failed to read Linux process-tree resource metadata: ${message}`)
  }
}

export const create = ({ connectionId, pid }: { connectionId: number; pid: number }) => {
  return [{ connectionId, measurement: undefined, pid } satisfies State]
}

export const start = async (state: State) => {
  const metadata = await readMetadata(state.connectionId)
  state.measurement = metadata.measurement
  return {
    command: metadata.command,
    perfPid: metadata.perfPid,
    pid: state.pid,
    workerPid: metadata.measurement.workerPid,
  }
}

export const stop = async (state: State): Promise<LinuxProcessTreeWorker.Result> => {
  const measurement = state.measurement || (await readMetadata(state.connectionId)).measurement
  try {
    return await LinuxProcessTreeWorker.stop(measurement)
  } finally {
    state.measurement = undefined
  }
}

export const releaseResources = async (state: State) => {
  if (state.measurement) {
    await LinuxProcessTreeWorker.dispose(state.measurement)
    state.measurement = undefined
  }
}

export const compare = (_before: Dynamic, after: Dynamic) => after

export const isLeak = () => false

export const summary = (result: LinuxProcessTreeWorker.Result): string => LinuxProcessTreeWorker.formatSummary(result)
