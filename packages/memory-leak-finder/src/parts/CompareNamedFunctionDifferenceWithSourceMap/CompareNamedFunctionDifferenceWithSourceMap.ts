import * as Assert from '../Assert/Assert.ts'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'

const prepareBaseDifferenceItem = (baseDifferenceItem) => {
  const { beforeCount, count, name, sourceMapUrl, url } = baseDifferenceItem
  return {
    beforeCount,
    count,
    name,
    sourceMaps: [sourceMapUrl],
    stack: [url],
  }
}

const prepareBaseDifference = (baseDifference) => {
  const prepared: any[] = []
  for (const item of baseDifference) {
    prepared.push(prepareBaseDifferenceItem(item))
  }
  return prepared
}

const finishBaseDifferenceItem = (baseDifferenceItem) => {
  const { beforeCount, count, name, originalName, originalStack, stack } = baseDifferenceItem
  return {
    beforeCount,
    count,
    name: originalName || name,
    url: originalStack?.[0] || stack?.[0] || '',
  }
}

const finishBaseDifferenceItems = (baseDifferenceItemsWithStack) => {
  return baseDifferenceItemsWithStack.map(finishBaseDifferenceItem)
}

const addSourceMapsToFunctionDifference = async (baseDifference, context) => {
  const prepared = prepareBaseDifference(baseDifference)
  const classNames = false
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames, context.connectionId)
  const finished = finishBaseDifferenceItems(withOriginalStack)
  return finished
}

export const compareFunctionDifference = async (before, after, context) => {
  Assert.array(before)
  Assert.array(after)
  const baseDifference = CompareFunctionDifference.compareFunctionDifference(before, after)
  const difference = await addSourceMapsToFunctionDifference(baseDifference, context)
  return difference
}
