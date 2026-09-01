import * as LinuxProcessTreeWorker from '@vscode-memory-leak-finder/linux-process-tree-worker'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

interface State {
  measurement: LinuxProcessTreeWorker.MeasurementHandle | undefined
  readonly pid: number
}

export const id = MeasureId.LinuxProcessTreeResources

export const targets: readonly Dynamic[] = []

export const create = ({ pid }: { pid: number }) => {
  return [{ measurement: undefined, pid } satisfies State]
}

export const start = async (state: State) => {
  const measurement = await LinuxProcessTreeWorker.start(state.pid, { window: 'scenario' })
  state.measurement = measurement
  return {
    pid: state.pid,
    workerPid: measurement.workerPid,
  }
}

export const stop = async (state: State): Promise<LinuxProcessTreeWorker.Result> => {
  if (!state.measurement) {
    throw new Error('Linux process-tree resource measurement was not started')
  }
  try {
    return await LinuxProcessTreeWorker.stop(state.measurement)
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
