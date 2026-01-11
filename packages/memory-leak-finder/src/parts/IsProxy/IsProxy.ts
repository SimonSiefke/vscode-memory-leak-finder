export const isProxy = (value) => {
  return value && value.subtype && value.subtype === 'proxy'
}

export const isError = (value) => {
  return value && value.subtype && value.subtype === 'error'
}
