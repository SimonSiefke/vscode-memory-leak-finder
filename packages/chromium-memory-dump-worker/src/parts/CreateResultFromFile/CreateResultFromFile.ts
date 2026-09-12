import { readFile } from 'node:fs/promises'
import { createChromiumMemoryDumpResult, type ChromiumMemoryDumpResult } from '../ChromiumMemoryDump/ChromiumMemoryDump.ts'

interface ChromiumMemoryDumpCapture {
  readonly dataLossOccurred: boolean
  readonly inspectedPid?: number
  readonly traceEvents: readonly unknown[]
}

export async function createResultFromFile(path: string): Promise<ChromiumMemoryDumpResult> {
  const text = await readFile(path, 'utf8')
  const capture: ChromiumMemoryDumpCapture = JSON.parse(text)
  return createChromiumMemoryDumpResult(capture.traceEvents, capture.dataLossOccurred, capture.inspectedPid)
}
