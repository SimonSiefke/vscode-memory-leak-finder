import type { Dynamic } from '../Types/Types.ts'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as MemoryLeakFinderCompare from '../MemoryLeakFinderCompare/MemoryLeakFinderCompare.ts'
import * as MemoryLeakFinderStart from '../MemoryLeakFinderStart/MemoryLeakFinderStart.ts'
import * as MemoryLeakFinderStop from '../MemoryLeakFinderStop/MemoryLeakFinderStop.ts'
import * as MemoryLeakWorkerCommandType from '../MemoryLeakWorkerCommandType/MemoryLeakWorkerCommandType.ts'
export const commandMap: Record<string, Dynamic> = {
  [MemoryLeakWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderCompare]: MemoryLeakFinderCompare.compare,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderStart]: MemoryLeakFinderStart.start,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderStop]: MemoryLeakFinderStop.stop,
}
