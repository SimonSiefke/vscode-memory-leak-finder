import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getSymbolCountsData = () => {
  return GetCountData.getCountData('symbol-count', 'symbolCount')
}
