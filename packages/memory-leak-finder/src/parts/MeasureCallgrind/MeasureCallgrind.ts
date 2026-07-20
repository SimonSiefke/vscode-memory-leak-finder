import * as CallgrindConfig from '../CallgrindConfig/CallgrindConfig.ts'
import * as CallgrindControl from '../CallgrindControl/CallgrindControl.ts'
import * as CollectCallgrindResults from '../CollectCallgrindResults/CollectCallgrindResults.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.Callgrind

export const targets: readonly any[] = []

export const create = ({ connectionId }: { connectionId: number }) => {
  return [CallgrindConfig.getCallgrindConfig(connectionId)]
}

export const start = async (config: CallgrindConfig.CallgrindConfig): Promise<{ startedAt: number }> => {
  await CallgrindControl.start(config)
  return {
    startedAt: Date.now(),
  }
}

export const stop = async (config: CallgrindConfig.CallgrindConfig): Promise<{ stoppedAt: number }> => {
  await CallgrindControl.stop(config)
  return {
    stoppedAt: Date.now(),
  }
}

export const compare = async (
  before: { startedAt: number },
  after: { stoppedAt: number },
  context: { resultPath?: string },
  config: CallgrindConfig.CallgrindConfig,
) => {
  if (!context.resultPath) {
    throw new Error(`Callgrind measure requires resultPath in compare context`)
  }
  const result = await CollectCallgrindResults.collectCallgrindResults(config, context.resultPath)
  return {
    ...result,
    startedAt: before.startedAt,
    stoppedAt: after.stoppedAt,
  }
}

export const isLeak = () => {
  return false
}
