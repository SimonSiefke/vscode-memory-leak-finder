import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

const compareCount = (a, b) => {
  return b.count - a.count
}

const getIndex = (values, line, column) => {
  for (let i = 0; i < values.length; i += 2) {
    const valueLine = values[i]
    const valueColumn = values[i + 1]
    if (valueLine === line && valueColumn === column) {
      return i / 2
    }
  }
  return -1
}

export const combineEventListenersWithSourceMapResults = (eventListeners, map, cleanPositionMap) => {
  Assert.array(eventListeners)
  Assert.object(map)
  Assert.object(cleanPositionMap)
  const newEventListeners = []
  for (const eventListener of eventListeners) {
    const { sourceMapUrl, line, column } = GetSourceMapUrl.getSourceMapUrl(eventListener)
    const index = getIndex(map[sourceMapUrl], line, column)
    if (index === -1) {
      throw new Error(`index not found for ${sourceMapUrl}:${line}:${column}`)
    }
    const cleanPosition = cleanPositionMap[sourceMapUrl]?.[index]
    if (cleanPosition) {
      const { sourceMaps, ...rest } = eventListener
      newEventListeners.push({
        ...rest,
        originalStack: [`${cleanPosition.source}:${cleanPosition.line}:${cleanPosition.column}`],
        originalName: cleanPosition.name,
      })
    } else {
      newEventListeners.push(eventListener)
    }
  }
  const sorted = Arrays.toSorted(newEventListeners, compareCount)
  return sorted
}
