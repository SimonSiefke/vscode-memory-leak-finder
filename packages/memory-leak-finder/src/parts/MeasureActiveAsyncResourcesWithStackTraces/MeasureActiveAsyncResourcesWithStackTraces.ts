import type { Session } from '../Session/Session.ts'
import type { Dynamic, MeasureContext } from '../Types/Types.ts'
import * as AsyncResourceTracker from '../AsyncResourceTracker/AsyncResourceTracker.ts'
import * as CompareActiveAsyncResources from '../CompareActiveAsyncResources/CompareActiveAsyncResources.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface AsyncResourceState {
  active: boolean
}

interface AsyncResourceCapture {
  readonly resources: readonly Dynamic[]
}

export const id = MeasureId.ActiveAsyncResourcesWithStackTraces
export const targets = [TargetId.Node]

export const create = (session: Session) => {
  return [session, { active: false } satisfies AsyncResourceState] as const
}

export const start = async (session: Session, state: AsyncResourceState): Promise<readonly Dynamic[]> => {
  await AsyncResourceTracker.start(session)
  state.active = true
  return []
}

export const stop = async (session: Session, state: AsyncResourceState): Promise<AsyncResourceCapture> => {
  const resources = await AsyncResourceTracker.stop(session)
  state.active = false
  return { resources }
}

export const compare = (_before: unknown, after: AsyncResourceCapture, context: MeasureContext): Dynamic => {
  return CompareActiveAsyncResources.compareActiveAsyncResources(undefined, after.resources, context)
}

export const isLeak = (result: Dynamic): boolean => result?.isLeak === true

export const releaseResources = async (session: Session, state: AsyncResourceState): Promise<void> => {
  if (state.active) {
    state.active = false
    try {
      await AsyncResourceTracker.cleanup(session)
    } catch {
      // The inspected process may already be gone.
    }
  }
}
