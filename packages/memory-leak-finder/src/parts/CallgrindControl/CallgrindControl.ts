import type { CallgrindConfig } from '../CallgrindConfig/CallgrindConfig.ts'
import * as ExecFile from '../ExecFile/ExecFile.ts'
import { VError } from '../VError/VError.ts'

const runCallgrindControl = async (config: CallgrindConfig, args: readonly string[]): Promise<void> => {
  try {
    await ExecFile.execFilePromise('callgrind_control', [`--vgdb-prefix=${config.vgdbPrefix}`, ...args])
  } catch (error) {
    throw new VError(error, `Failed to run callgrind_control`)
  }
}

export const start = async (config: CallgrindConfig): Promise<void> => {
  await runCallgrindControl(config, ['--zero', '--instr=on'])
}

export const stop = async (config: CallgrindConfig): Promise<void> => {
  await runCallgrindControl(config, ['--instr=off', '--dump=vmlf-measure'])
}
