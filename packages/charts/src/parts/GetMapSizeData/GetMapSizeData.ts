import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMapSizeData = (basePath: string) => {
  return GetCountData.getCountData('map-size', 'mapSize', basePath)
}
