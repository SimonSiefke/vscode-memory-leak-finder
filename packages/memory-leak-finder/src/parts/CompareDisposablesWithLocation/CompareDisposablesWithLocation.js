import * as Assert from '../Assert/Assert.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'
import * as FormatUrl from '../FormatUrl/FormatUrl.js'

const prepareDisposable = (disposable, scriptMap) => {
  const { lineNumber, columnNumber, count, scriptId, name } = disposable
  const script = scriptMap[scriptId] || {}
  const formattedUrl = FormatUrl.formatUrl(script.url, lineNumber, columnNumber)
  return {
    stack: [formattedUrl],
    sourceMaps: [script.sourceMapUrl],
    count,
    name,
  }
}

const prepareDisposables = (disposables, scriptMap) => {
  const prepared = []
  for (const disposable of disposables) {
    prepared.push(prepareDisposable(disposable, scriptMap))
  }
  return prepared
}

const finishDisposable = (disposableWithStack) => {
  const { stack, count, originalStack, originalName, name } = disposableWithStack
  return {
    name: originalName || name,
    count,
    location: originalStack?.[0] || stack?.[0] || '',
  }
}

const finishDisposables = (disposablesWithStack) => {
  return disposablesWithStack.map(finishDisposable)
}

const improveDisposableOutput = async (disposables, scriptMap) => {
  const prepared = prepareDisposables(disposables, scriptMap)
  const classNames = true
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames)
  const finished = finishDisposables(withOriginalStack)
  return finished
}

const addDeltas = (prettyBefore, prettyAfter) => {
  const newItems = []
  const countMap = Object.create(null)
  for (const item of prettyBefore) {
    countMap[item.name] = item.count
  }
  for (const item of prettyAfter) {
    const { name, count, location } = item
    newItems.push({
      name,
      count,
      oldCount: countMap[item.name] || 0,
      location,
    })
  }
  return newItems
}

export const compareDisposablesWithLocation = async (before, after) => {
  const beforeResult = before
  const afterResult = after.result
  const scriptMap = after.scriptMap
  Assert.array(beforeResult)
  Assert.array(afterResult)
  Assert.object(scriptMap)
  const prettyBefore = await improveDisposableOutput(beforeResult, scriptMap)
  const prettyAfter = await improveDisposableOutput(afterResult, scriptMap)
  const withDeltas = addDeltas(prettyBefore, prettyAfter)
  return withDeltas
}
