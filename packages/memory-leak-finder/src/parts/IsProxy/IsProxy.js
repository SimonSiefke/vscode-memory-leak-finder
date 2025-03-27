export const isProxy = (value) => {
  return value && value.subtype && value.subtype === 'proxy'
}
