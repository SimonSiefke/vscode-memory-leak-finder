import * as FormatUrl from '../FormatUrl/FormatUrl.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

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

export const improveDisposableOutput = async (disposables, scriptMap) => {
  const prepared = prepareDisposables(disposables, scriptMap)
  const classNames = true
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames)
  const finished = finishDisposables(withOriginalStack)
  return finished
}
