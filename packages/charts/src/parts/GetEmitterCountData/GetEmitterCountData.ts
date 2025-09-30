import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEmitterCountData = (basePath: string) => {
  return GetCountData.getCountData('emitter-count', 'emitterCount', basePath)
}
