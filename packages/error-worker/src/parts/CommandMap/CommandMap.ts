import * as PrettyError from '../PrettyError/PrettyError.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'PrettyError.prepare': PrettyError.prepare,
}
