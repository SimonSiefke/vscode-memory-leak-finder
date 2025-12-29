import { exec } from '../Exec/Exec.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'exec.exec': exec,
}
