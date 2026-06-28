import type { Dynamic } from '../Types/Types.ts'
export const isLeakCount = ({ after, before }: Dynamic) => {
  return after > before
}
