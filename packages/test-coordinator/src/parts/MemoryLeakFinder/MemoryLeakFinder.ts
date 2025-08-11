// TODO run memory leak finder in a separate worker for better separation of concerns
// and to keep test framework independent of memory leak checks and vice versa
export * from '../MemoryLeakFinderCompare/MemoryLeakFinderCompare.ts'
export * from '../MemoryLeakFinderSetup/MemoryLeakFinderSetup.ts'
export * from '../MemoryLeakFinderStart/MemoryLeakFinderStart.ts'
export * from '../MemoryLeakFinderStop/MemoryLeakFinderStop.ts'
