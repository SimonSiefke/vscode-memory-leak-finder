import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as MemoryLeakFinderCompare from '../MemoryLeakFinderCompare/MemoryLeakFinderCompare.ts'
import * as MemoryLeakFinderCompareWithWorkers from '../MemoryLeakFinderCompareWithWorkers/MemoryLeakFinderCompareWithWorkers.ts'
import * as MemoryLeakFinderSetup from '../MemoryLeakFinderSetup/MemoryLeakFinderSetup.ts'
import * as MemoryLeakFinderStart from '../MemoryLeakFinderStart/MemoryLeakFinderStart.ts'
import * as MemoryLeakFinderStop from '../MemoryLeakFinderStop/MemoryLeakFinderStop.ts'
import * as MemoryLeakWorkerCommandType from '../MemoryLeakWorkerCommandType/MemoryLeakWorkerCommandType.ts'

export const commandMap: Record<string, any> = {
  [MemoryLeakWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderCompare]: MemoryLeakFinderCompare.compare,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderCompareWithWorkers]: MemoryLeakFinderCompareWithWorkers.compareWithWorkers,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderSetup]: MemoryLeakFinderSetup.setup,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderStart]: MemoryLeakFinderStart.start,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderStop]: MemoryLeakFinderStop.stop,
}
