import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'OriginalName.getOriginalName': GetOriginalClassName.getOriginalClassName,
}
