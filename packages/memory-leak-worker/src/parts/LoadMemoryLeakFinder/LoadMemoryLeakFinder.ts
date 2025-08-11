const memoryLeakFinderUrl:string= '../../../../memory-leak-finder/src/index.js'

// TODO move that code here
export const loadMemoryLeakFinder = async () => {
  const MemoryLeakFinder = await import(memoryLeakFinderUrl)

  return MemoryLeakFinder
}
