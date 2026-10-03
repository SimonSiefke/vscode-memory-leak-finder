import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import {
  createUnsupportedResult,
  formatChromiumMemoryDumpSummary,
  type ChromiumMemoryDumpResult,
} from '../ChromiumMemoryDump/ChromiumMemoryDump.ts'
import * as ChromiumMemoryDumpCapture from '../ChromiumMemoryDumpCapture/ChromiumMemoryDumpCapture.ts'
import { launchChromiumMemoryDumpWorker } from '../LaunchChromiumMemoryDumpWorker/LaunchChromiumMemoryDumpWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.ChromiumMemoryDump
export const targets = [TargetId.Browser]

export function create(session: Session) {
  const capturePath = join(Root.root, '.tmp', `chromium-memory-dump-${randomUUID()}.json`)
  const state = ChromiumMemoryDumpCapture.create(session, capturePath)
  process.once('exit', () => {
    rmSync(capturePath, { force: true })
  })
  return [session, state] as const
}

export async function start(
  _session: Session,
  state: ChromiumMemoryDumpCapture.ChromiumMemoryDumpCaptureState,
): Promise<ChromiumMemoryDumpResult | null> {
  const unsupportedReason = await ChromiumMemoryDumpCapture.start(state)
  return unsupportedReason ? createUnsupportedResult(unsupportedReason) : null
}

export async function stop(
  _session: Session,
  state: ChromiumMemoryDumpCapture.ChromiumMemoryDumpCaptureState,
): Promise<ChromiumMemoryDumpCapture.ChromiumMemoryDumpCaptureResult> {
  return ChromiumMemoryDumpCapture.stop(state)
}

export async function compare(
  _before: ChromiumMemoryDumpResult | null,
  after: ChromiumMemoryDumpCapture.ChromiumMemoryDumpCaptureResult,
): Promise<ChromiumMemoryDumpResult> {
  if (after.unsupportedReason) {
    return createUnsupportedResult(after.unsupportedReason)
  }
  try {
    await using rpc = await launchChromiumMemoryDumpWorker()
    return await rpc.invoke('ChromiumMemoryDump.createResultFromFile', after.path)
  } finally {
    await rm(after.path, { force: true })
  }
}

export function isLeak(): false {
  return false
}

export function summary(result: ChromiumMemoryDumpResult): string {
  return formatChromiumMemoryDumpSummary(result)
}

export async function releaseResources(_session: Session, state: ChromiumMemoryDumpCapture.ChromiumMemoryDumpCaptureState): Promise<void> {
  await ChromiumMemoryDumpCapture.release(state)
  if (!state.captured) {
    await rm(state.capturePath, { force: true })
  }
}
