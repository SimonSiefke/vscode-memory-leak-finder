import * as GetCountData from '../GetCountData/GetCountData.js'

export const getMapSizeData = () => {
  return GetCountData.getCountData('map-size', 'mapSize')
}
