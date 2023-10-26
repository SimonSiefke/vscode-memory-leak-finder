const isEnumerable = (property) => {
  return property.enumerable
}

const getValue = (object) => {
  return object.value
}

export const getDescriptorValues = (properties) => {
  const descriptors = properties.filter(isEnumerable).map(getValue)
  return descriptors
}
