import * as Assert from '../Assert/Assert.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const prepareDisposable = (disposable, scriptMap) => {
  const { lineNumber, columnNumber, count, scriptId } = disposable
  const script = scriptMap[scriptId] || {}
  return {
    stack: [`${script.url}:${lineNumber}:${columnNumber}`],
    sourceMaps: [script.sourceMapUrl],
    count,
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
  const { stack, count, originalStack, originalName } = disposableWithStack
  return {
    name: originalName,
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

export const compareDisposablesWithLocation = async (before, after) => {
  const beforeResult = before
  const afterResult = after.result
  const scriptMap = after.scriptMap
  Assert.array(beforeResult)
  Assert.array(afterResult)
  Assert.object(scriptMap)
  const prettyBefore = await improveDisposableOutput(beforeResult, scriptMap)
  const prettyAfter = await improveDisposableOutput(afterResult, scriptMap)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
