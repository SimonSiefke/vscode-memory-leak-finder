import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'

export type CommandHandler = (...args: readonly unknown[]) => unknown

export const commandMap: Record<string, CommandHandler> = {
  'OriginalName.getOriginalName': GetOriginalClassName.getOriginalClassName,
}
