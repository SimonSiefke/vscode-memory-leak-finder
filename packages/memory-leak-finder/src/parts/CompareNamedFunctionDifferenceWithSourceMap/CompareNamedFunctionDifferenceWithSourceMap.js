import * as Assert from '../Assert/Assert.js'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const prepareBaseDifferenceItem = (baseDifferenceItem, scriptMap) => {
  const { url, count, name, scriptId } = baseDifferenceItem
  const script = scriptMap[scriptId] || {}
  return {
    stack: [url],
    sourceMaps: [script.sourceMapUrl],
    count,
    name,
  }
}

const prepareBaseDifference = (baseDifference, scriptMap) => {
  const prepared = []
  for (const item of baseDifference) {
    prepared.push(prepareBaseDifferenceItem(item, scriptMap))
  }
  return prepared
}

const finishBaseDifferenceItem = (baseDifferenceItem) => {
  const { stack, count, originalStack, originalName, name } = baseDifferenceItem
  return {
    name: originalName || name,
    count,
    location: originalStack?.[0] || stack?.[0] || '',
  }
}

const finishBaseDifferenceItems = (baseDifferenceItemsWithStack) => {
  return baseDifferenceItemsWithStack.map(finishBaseDifferenceItem)
}

const addSourceMapsToFunctionDifference = async (baseDifference, scriptMap) => {
  const prepared = prepareBaseDifference(baseDifference, scriptMap)
  const classNames = false
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames)
  const finished = finishBaseDifferenceItems(withOriginalStack)
  return finished
}

export const compareFunctionDifference = async (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const scriptMap = after.scriptMap
  const baseDifference = CompareFunctionDifference.compareFunctionDifference(before, after)
  const difference = await addSourceMapsToFunctionDifference(baseDifference, scriptMap)
  return difference
}
