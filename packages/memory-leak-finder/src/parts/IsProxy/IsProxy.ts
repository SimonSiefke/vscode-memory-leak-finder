import type { Dynamic } from '../Types/Types.ts'
export const isProxy = (value: Dynamic) => {
  return value && value.subtype && value.subtype === 'proxy'
}
export const isError = (value: Dynamic) => {
  return value && value.subtype && value.subtype === 'error'
}
