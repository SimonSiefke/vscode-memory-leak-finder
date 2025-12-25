import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMapCountData = (basePath: string) => {
  return GetCountData.getCountData('map-count', 'mapCount', basePath)
}
