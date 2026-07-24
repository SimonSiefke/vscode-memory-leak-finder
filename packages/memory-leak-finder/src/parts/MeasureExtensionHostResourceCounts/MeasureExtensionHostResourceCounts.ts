import type { Dynamic } from '../Types/Types.ts'
import * as MeasureAbortControllerCount from '../MeasureAbortControllerCount/MeasureAbortControllerCount.ts'
import * as MeasureAbortSignalCount from '../MeasureAbortSignalCount/MeasureAbortSignalCount.ts'
import * as MeasureFileDescriptorCount from '../MeasureFileDescriptorCount/MeasureFileDescriptorCount.ts'
import * as MeasureFileWatcherCount from '../MeasureFileWatcherCount/MeasureFileWatcherCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as MeasureMessagePortCount from '../MeasureMessagePortCount/MeasureMessagePortCount.ts'
import * as MeasurePendingPromiseCount from '../MeasurePendingPromiseCount/MeasurePendingPromiseCount.ts'
import * as MeasureProcessCount from '../MeasureProcessCount/MeasureProcessCount.ts'
import * as MeasurePromiseCount from '../MeasurePromiseCount/MeasurePromiseCount.ts'
import * as MeasureSetTimeoutWithStackTrace from '../MeasureSetTimeoutWithStackTrace/MeasureSetTimeoutWithStackTrace.ts'
import * as MeasureStoredPromiseReferences from '../MeasureStoredPromiseReferences/MeasureStoredPromiseReferences.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface ResourceMeasure {
  readonly compare: (before: Dynamic, after: Dynamic, context: Dynamic, ...args: Dynamic[]) => Dynamic
  readonly create: (context: Dynamic) => Dynamic[]
  readonly id: string
  readonly isLeak: (result: Dynamic) => boolean
  readonly releaseResources?: (...args: Dynamic[]) => Promise<void>
  readonly start: (...args: Dynamic[]) => Promise<Dynamic> | Dynamic
  readonly stop: (...args: Dynamic[]) => Promise<Dynamic> | Dynamic
}

interface ResourceMeasureInstance {
  readonly args: Dynamic[]
  readonly measure: ResourceMeasure
}

const resourceMeasures: readonly ResourceMeasure[] = [
  MeasureAbortControllerCount,
  MeasureAbortSignalCount,
  MeasureFileDescriptorCount,
  MeasureFileWatcherCount,
  MeasureMessagePortCount,
  MeasurePendingPromiseCount,
  MeasureProcessCount,
  MeasurePromiseCount,
  MeasureSetTimeoutWithStackTrace,
  MeasureStoredPromiseReferences,
]

export const id = MeasureId.ExtensionHostResourceCounts

export const targets = [TargetId.Node]

export const create = (context: Dynamic): [readonly ResourceMeasureInstance[]] => {
  const instances = resourceMeasures.map((measure) => ({
    args: measure.create(context),
    measure,
  }))
  return [instances]
}

const collect = async (instances: readonly ResourceMeasureInstance[], phase: 'start' | 'stop') => {
  const result: Record<string, Dynamic> = Object.create(null)
  for (const { args, measure } of instances) {
    result[measure.id] = await measure[phase](...args)
  }
  return result
}

export const start = (instances: readonly ResourceMeasureInstance[]) => {
  return collect(instances, 'start')
}

export const stop = (instances: readonly ResourceMeasureInstance[]) => {
  return collect(instances, 'stop')
}

export const compare = async (
  before: Record<string, Dynamic>,
  after: Record<string, Dynamic>,
  context: Dynamic,
  instances: readonly ResourceMeasureInstance[],
) => {
  const resources: Record<string, Dynamic> = Object.create(null)
  let isLeak = false
  for (const { args, measure } of instances) {
    const result = await measure.compare(before[measure.id], after[measure.id], context, ...args)
    resources[measure.id] = result
    isLeak ||= measure.isLeak(result)
  }
  return {
    isLeak,
    resources,
  }
}

export const isLeak = (result: Dynamic) => {
  return result.isLeak
}

export const releaseResources = async (instances: readonly ResourceMeasureInstance[]) => {
  for (const { args, measure } of instances) {
    await measure.releaseResources?.(...args)
  }
}
