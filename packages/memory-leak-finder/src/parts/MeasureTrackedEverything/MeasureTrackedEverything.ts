import { randomUUID } from 'node:crypto'
import { mkdir, open, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as CompareTrackedEverything from '../CompareTrackedEverything/CompareTrackedEverything.ts'
import * as GetTrackedEverything from '../GetTrackedEverything/GetTrackedEverything.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface TrackedEverythingState {
  readonly scriptHandler: IScriptHandler
  readonly temporaryEventPath: string
}

export const id = MeasureId.TrackedEverything
export const targets = [TargetId.Browser]

export const create = (session: Session): readonly [Session, TrackedEverythingState] => {
  return [
    session,
    {
      scriptHandler: ScriptHandler.create(),
      temporaryEventPath: join(Root.root, '.vscode-tracked-everything', `${randomUUID()}.events.bin`),
    },
  ]
}

export const start = async (session: Session, state: TrackedEverythingState) => {
  await state.scriptHandler.start(session)
  return {}
}

const writeChunk = async (handle: Awaited<ReturnType<typeof open>>, chunk: readonly number[]): Promise<void> => {
  const buffer = Buffer.allocUnsafe(chunk.length * 4)
  for (let index = 0; index < chunk.length; index++) {
    buffer.writeUInt32LE(chunk[index], index * 4)
  }
  await handle.write(buffer)
}

export const stop = async (session: Session, state: TrackedEverythingState) => {
  const metadata = await GetTrackedEverything.getTrackedEverythingMetadata(session)
  if (metadata.eventCount === 0) {
    await state.scriptHandler.stop(session)
    throw new Error(
      'Tracked everything produced no data. The VS Code workbench was not instrumented, or no instrumented modules were loaded.',
    )
  }
  await mkdir(dirname(state.temporaryEventPath), { recursive: true })
  const handle = await open(state.temporaryEventPath, 'w')
  let writtenEventCount = 0
  try {
    for (let index = 0; index < metadata.chunkCount; index++) {
      const chunk = await GetTrackedEverything.getTrackedEverythingChunk(session, index)
      await writeChunk(handle, chunk)
      writtenEventCount += chunk.length
    }
  } finally {
    await handle.close()
    await state.scriptHandler.stop(session)
  }
  if (writtenEventCount !== metadata.eventCount) {
    await rm(state.temporaryEventPath, { force: true })
    throw new Error(`Tracked everything event stream is incomplete: expected ${metadata.eventCount}, received ${writtenEventCount}`)
  }
  return {
    metadata,
    scriptMap: state.scriptHandler.scriptMap,
    temporaryEventPath: state.temporaryEventPath,
  }
}

export const compare = CompareTrackedEverything.compareTrackedEverything

export const isLeak = () => false

export const releaseResources = async (session: Session, state: TrackedEverythingState): Promise<void> => {
  try {
    await state.scriptHandler.stop(session)
  } catch {
    // Debugger may already be disabled.
  }
  await rm(state.temporaryEventPath, { force: true })
}
