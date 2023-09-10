import { spawn } from 'child_process'
import * as GetFfmpegOptions from '../GetFfmpegOptions/GetFfmpegOptions.js'

export const start = () => {
  const options = GetFfmpegOptions.getFfmpegOptions()
  const childProcess = spawn(command)
}
