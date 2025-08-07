import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMapSizeData = () => {
  return GetCountData.getCountData('map-size', 'mapSize')
}
