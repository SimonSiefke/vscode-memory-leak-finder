import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'

const prepareDisposable = (disposable, scriptMap) => {
  const { columnNumber, count, lineNumber, name, scriptId } = disposable
  const script = scriptMap[scriptId] || {}
  const formattedUrl = FormatUrl.formatUrl(script.url, lineNumber, columnNumber)
  return {
    count,
    name,
    sourceMaps: [script.sourceMapUrl],
    stack: [formattedUrl],
  }
}

const prepareDisposables = (disposables, scriptMap) => {
  const prepared: any[] = []
  for (const disposable of disposables) {
    prepared.push(prepareDisposable(disposable, scriptMap))
  }
  return prepared
}

const finishDisposable = (disposableWithStack) => {
  const { count, name, originalName, originalStack, stack } = disposableWithStack
  return {
    count,
    location: originalStack?.[0] || stack?.[0] || '',
    name: originalName || name,
  }
}

const finishDisposables = (disposablesWithStack) => {
  return disposablesWithStack.map(finishDisposable)
}

export const improveDisposableOutput = async (disposables, scriptMap, context) => {
  const prepared = prepareDisposables(disposables, scriptMap)
  const classNames = true
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames, context.connectionId)
  const finished = finishDisposables(withOriginalStack)
  return finished
}
