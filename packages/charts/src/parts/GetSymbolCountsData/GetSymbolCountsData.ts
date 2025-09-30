import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getSymbolCountsData = (basePath: string) => {
  return GetCountData.getCountData('symbol-count', 'symbolCount', basePath)
}
