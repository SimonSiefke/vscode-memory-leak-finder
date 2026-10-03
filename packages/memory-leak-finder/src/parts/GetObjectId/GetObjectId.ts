import type { Dynamic } from '../Types/Types.ts'
export const getObjectId = (value: Dynamic) => {
  return value.objectId || ''
}
