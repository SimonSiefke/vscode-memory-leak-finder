import * as GetObjectId from '../GetObjectId/GetObjectId.js'

const isFunctionDescriptor = (descriptor) => {
  return descriptor.type === 'function'
}

export const getFunctionObjectIds = (descriptors) => {
  const functionDescriptors = descriptors.filter(isFunctionDescriptor)
  const objectIds = functionDescriptors.map(GetObjectId.getObjectId)
  return objectIds
}
