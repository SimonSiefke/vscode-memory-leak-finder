export const loadMemoryLeakFinder = async () => {
  const MemoryLeakFinder = await import('../../../src/index.js')
  return MemoryLeakFinder
}
