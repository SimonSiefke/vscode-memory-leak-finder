import * as Assert from '../Assert/Assert.ts'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'

const prepareBaseDifferenceItem = (baseDifferenceItem: { beforeCount: number; count: number; name: string; sourceMapUrl: string; url: string }): { beforeCount: number; count: number; name: string; sourceMaps: readonly string[]; stack: readonly string[] } => {
  const { beforeCount, count, name, sourceMapUrl, url } = baseDifferenceItem
  return {
    beforeCount,
    count,
    name,
    sourceMaps: [sourceMapUrl],
    stack: [url],
  }
}

const prepareBaseDifference = (baseDifference: readonly { beforeCount: number; count: number; name: string; sourceMapUrl: string; url: string }[]): readonly { beforeCount: number; count: number; name: string; sourceMaps: readonly string[]; stack: readonly string[] }[] => {
  const prepared: { beforeCount: number; count: number; name: string; sourceMaps: readonly string[]; stack: readonly string[] }[] = []
  for (const item of baseDifference) {
    prepared.push(prepareBaseDifferenceItem(item))
  }
  return prepared
}

const finishBaseDifferenceItem = (baseDifferenceItem: { beforeCount: number; count: number; name: string; originalName?: string; originalStack?: readonly string[]; stack?: readonly string[] }): { beforeCount: number; count: number; name: string; url: string } => {
  const { beforeCount, count, name, originalName, originalStack, stack } = baseDifferenceItem
  return {
    beforeCount,
    count,
    name: originalName || name,
    url: originalStack?.[0] || stack?.[0] || '',
  }
}

const finishBaseDifferenceItems = (baseDifferenceItemsWithStack: readonly { beforeCount: number; count: number; name: string; originalName?: string; originalStack?: readonly string[]; stack?: readonly string[] }[]): readonly { beforeCount: number; count: number; name: string; url: string }[] => {
  return baseDifferenceItemsWithStack.map(finishBaseDifferenceItem)
}

const addSourceMapsToFunctionDifference = async (baseDifference) => {
  const prepared = prepareBaseDifference(baseDifference)
  const classNames = false
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prepared, classNames)
  const finished = finishBaseDifferenceItems(withOriginalStack)
  return finished
}

export const compareFunctionDifference = async (before: unknown, after: unknown): Promise<readonly { beforeCount: number; count: number; name: string; url: string }[]> => {
  Assert.array(before)
  Assert.array(after)
  const baseDifference = CompareFunctionDifference.compareFunctionDifference(before, after)
  const difference = await addSourceMapsToFunctionDifference(baseDifference)
  return difference
}
