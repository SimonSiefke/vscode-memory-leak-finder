import * as GetCountData from '../GetCountData/GetCountData.js'

export const getEmitterCountData = () => {
  return GetCountData.getCountData('emitter-count', 'emitterCount')
}
