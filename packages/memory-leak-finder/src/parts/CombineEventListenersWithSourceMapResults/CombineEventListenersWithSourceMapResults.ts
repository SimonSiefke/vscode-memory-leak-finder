import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.ts'
import * as ParseLineAndColumn from '../ParseLineAndColumn/ParseLineAndColumn.ts'

const compareCount = (a, b) => {
  return b.count - a.count
}

export const combineEventListenersWithSourceMapResults = (eventListeners, map, cleanPositionMap) => {
  Assert.array(eventListeners)
  Assert.object(map)
  Assert.object(cleanPositionMap)
  const newEventListeners: any[] = []
  
  for (const eventListener of eventListeners) {
    const { stack, sourceMaps } = eventListener
    if (!stack || !sourceMaps || stack.length === 0) {
      newEventListeners.push(eventListener)
      continue
    }

    const originalStack: string[] = []
    let sourcesHash: string | null | undefined = null
    let firstCleanPosition: any = null
    
    // Process each stack line
    for (let i = 0; i < stack.length; i++) {
      const stackLine = stack[i]
      const sourceMap = sourceMaps[0] // Use first sourceMap for all lines
      const { column, line } = ParseLineAndColumn.parseLineAndColumn(stackLine)
      
      if (sourceMap && line && column) {
        const index = getIndex(map[sourceMap], line, column)
        if (index !== -1) {
          const cleanPosition = cleanPositionMap[sourceMap]?.[index]
          if (cleanPosition) {
            originalStack.push(`${cleanPosition.source}:${cleanPosition.line}:${cleanPosition.column}`)
            if (i === 0) {
              firstCleanPosition = cleanPosition
            }
            if (i === 0 && cleanPosition.sourcesHash) {
              sourcesHash = cleanPosition.sourcesHash
            }
          } else {
            originalStack.push(stackLine)
          }
        } else {
          originalStack.push(stackLine)
        }
      } else {
        originalStack.push(stackLine)
      }
    }

    const { sourceMaps: _, ...rest } = eventListener
    newEventListeners.push({
      ...rest,
      originalName: firstCleanPosition?.name || '',
      originalStack,
      sourcesHash,
    })
  }
  const sorted = Arrays.toSorted(newEventListeners, compareCount)
  return sorted
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
