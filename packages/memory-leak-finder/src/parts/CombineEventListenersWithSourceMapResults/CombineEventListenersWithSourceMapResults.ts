import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.ts'

type EventListenerWithCount = {
  readonly count: number
  readonly [key: string]: unknown
}

const compareCount = (a: EventListenerWithCount, b: EventListenerWithCount): number => {
  return b.count - a.count
}

const getIndex = (values: readonly number[], line: number, column: number): number => {
  for (let i = 0; i < values.length; i += 2) {
    const valueLine = values[i]
    const valueColumn = values[i + 1]
    if (valueLine === line && valueColumn === column) {
      return i / 2
    }
  }
  return -1
}

type EventListener = {
  readonly column: number
  readonly count: number
  readonly line: number
  readonly sourceMapUrl: string
  readonly sourceMaps?: readonly string[]
  readonly [key: string]: unknown
}

type CleanPositionMap = {
  readonly [sourceMapUrl: string]: readonly (readonly { column?: number; line?: number; name?: string; source?: string; sourcesHash?: string | null } | undefined)[]
}

export const combineEventListenersWithSourceMapResults = (eventListeners: readonly EventListener[], map: { readonly [sourceMapUrl: string]: readonly number[] }, cleanPositionMap: CleanPositionMap): readonly EventListener[] => {
  Assert.array(eventListeners)
  Assert.object(map)
  Assert.object(cleanPositionMap)
  const newEventListeners: EventListener[] = []
  for (const eventListener of eventListeners) {
    const { column, line, sourceMapUrl } = GetSourceMapUrl.getSourceMapUrl(eventListener)
    const index = getIndex(map[sourceMapUrl], line, column)
    if (index === -1) {
      throw new Error(`index not found for ${sourceMapUrl}:${line}:${column}`)
    }
    const cleanPosition = cleanPositionMap[sourceMapUrl]?.[index]
    if (cleanPosition) {
      const { sourceMaps, ...rest } = eventListener
      newEventListeners.push({
        ...rest,
        originalName: cleanPosition.name,
        originalStack: [`${cleanPosition.source}:${cleanPosition.line}:${cleanPosition.column}`],
        sourcesHash: cleanPosition.sourcesHash || null,
      })
    } else {
      newEventListeners.push(eventListener)
    }
  }
  const sorted = Arrays.toSorted(newEventListeners, compareCount)
  return sorted
}
