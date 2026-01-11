import * as ExecWorker from '../ExecWorker/ExecWorker.ts'

export const exec = async (command: string, args: readonly string[], options: any = {}): Promise<any> => {
  await using execWorker = await ExecWorker.launchExecWorker()
  const result = await execWorker.exec(command, args, options)
  return result
}
