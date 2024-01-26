import * as Assert from '../Assert/Assert.js'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const prepareBaseDifferenceItem = (baseDifferenceItem) => {
  const { url, sourceMapUrl, count, beforeCount, name } = baseDifferenceItem
  return {
    stack: [url],
    sourceMaps: [sourceMapUrl],
    count,
    beforeCount,
    name,
  }
}

const prepareBaseDifference = (baseDifference) => {
  const prepared = []
  for (const item of baseDifference) {
    prepared.push(prepareBaseDifferenceItem(item))
  }
  return prepared
}

const finishBaseDifferenceItem = (baseDifferenceItem) => {
  const { stack, count, originalStack, originalName, name, beforeCount } = baseDifferenceItem
  return {
    name: originalName || name,
    count,
    beforeCount,
    url: originalStack?.[0] || stack?.[0] || '',
  }
}

const finishBaseDifferenceItems = (baseDifferenceItemsWithStack) => {
  return baseDifferenceItemsWithStack.map(finishBaseDifferenceItem)
}

const addSourceMapsToFunctionDifference = async (baseDifference) => {
  const prepared = prepareBaseDifference(baseDifference)
  const classNames = false
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames)
  const finished = finishBaseDifferenceItems(withOriginalStack)
  return finished
}

export const compareFunctionDifference = async (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const baseDifference = CompareFunctionDifference.compareFunctionDifference(before, after)
  const difference = await addSourceMapsToFunctionDifference(baseDifference)
  return difference
}
