import * as CleanEventListener from '../CleanEventListener/CleanEventListener.ts'

type EventListener = {
  readonly handler: { description: string; objectId: string }
  readonly lineNumber: number
  readonly columnNumber: number
  readonly scriptId: string
  readonly type: string
  readonly [key: string]: unknown
}

type CleanEventListener = {
  readonly description: string
  readonly objectId: string
  readonly sourceMaps: readonly string[]
  readonly stack: readonly string[]
  readonly type: string
}

export const cleanEventListeners = (eventListeners: readonly EventListener[], scriptMap: unknown): readonly CleanEventListener[] => {
  const cleanListeners: CleanEventListener[] = []
  for (const listener of eventListeners) {
    const cleanListener = CleanEventListener.cleanEventListener(listener, scriptMap)
    cleanListeners.push(cleanListener)
  }
  return cleanListeners
}
