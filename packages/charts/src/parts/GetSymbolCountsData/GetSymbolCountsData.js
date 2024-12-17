import * as GetCountData from '../GetCountData/GetCountData.js'

export const getSymbolCountsData = () => {
  return GetCountData.getCountData('symbol-count', 'symbolCount')
}
