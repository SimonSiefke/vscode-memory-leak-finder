import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEmitterCountData = () => {
  return GetCountData.getCountData('emitter-count', 'emitterCount')
}
