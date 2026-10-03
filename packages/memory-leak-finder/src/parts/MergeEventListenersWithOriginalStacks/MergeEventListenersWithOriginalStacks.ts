import type { Dynamic } from '../Types/Types.ts'

export const mergeEventListenersWithOriginalStacks = (eventListeners: Dynamic, cleanInstances: Dynamic) => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged: Dynamic[] = []
  let originalIndex = 0
  for (const eventListener of eventListeners) {
    originalIndex++
    const originalStack: Dynamic[] = []
    let originalName: string | undefined
    let sourcesHash: string | null = null
    for (let i = 0; i < eventListener.stack.length; i++) {
      originalIndex++
      const instance = reverseMap[originalIndex]
      if (instance?.originalStack) {
        originalStack.push(instance.originalStack[0])
        if (i === 0) {
          originalName = instance.originalName
          sourcesHash = instance.sourcesHash || null
        }
      }
    }
    const { sourceMaps, ...rest } = eventListener
    merged.push({
      ...rest,
      originalName,
      originalStack,
      sourcesHash,
    })
  }
  return merged
}
