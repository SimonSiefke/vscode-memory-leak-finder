import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as GetHeapSnapshotForConnection from '../GetHeapSnapshotForConnection/GetHeapSnapshotForConnection.ts'
import * as GetNamedArrayCountForConnection from '../GetNamedArrayCountForConnection/GetNamedArrayCountForConnection.ts'
import * as MemoryLeakFinderCompare from '../MemoryLeakFinderCompare/MemoryLeakFinderCompare.ts'
import * as MemoryLeakFinderStart from '../MemoryLeakFinderStart/MemoryLeakFinderStart.ts'
import * as MemoryLeakFinderStop from '../MemoryLeakFinderStop/MemoryLeakFinderStop.ts'
import * as MemoryLeakWorkerCommandType from '../MemoryLeakWorkerCommandType/MemoryLeakWorkerCommandType.ts'

export const commandMap: Record<string, any> = {
  [MemoryLeakWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [MemoryLeakWorkerCommandType.GetHeapSnapshotForConnection]: GetHeapSnapshotForConnection.getHeapSnapshotForConnection,
  [MemoryLeakWorkerCommandType.GetNamedArrayCountForConnection]: GetNamedArrayCountForConnection.getNamedArrayCountForConnection,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderCompare]: MemoryLeakFinderCompare.compare,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderStart]: MemoryLeakFinderStart.start,
  [MemoryLeakWorkerCommandType.MemoryLeakFinderStop]: MemoryLeakFinderStop.stop,
}
