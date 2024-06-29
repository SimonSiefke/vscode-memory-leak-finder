export const loadMemoryLeakFinder = async () => {
  const MemoryLeakFinder = await import('../../../../memory-leak-finder/src/index.js')
  return MemoryLeakFinder
}
