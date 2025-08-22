import { spawn } from 'child_process'
import { existsSync } from 'fs'
import * as Assert from '../Assert/Assert.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'
import * as GetFfmpegOptions from '../GetFfmpegOptions/GetFfmpegOptions.ts'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.ts'

const handleStdinError = () => {
  console.log('ffmpeg error')
}

const handleStdinFinished = () => {
  console.log('ffmpeg finished')
}

const handleExit = () => {
  console.log('ffmpeg exit')
}

export const start = async (outFile: string): Promise<void> => {
  Assert.string(outFile)
  // TODO make ffmpegPath an argument
  const ffmpegPath = GetFfmpegPath.getFfmpegPath()
  if (!existsSync(ffmpegPath)) {
    throw new Error(`ffmpeg binary not found at ${ffmpegPath}`)
  }
  const fps = 25
  const width = 1024
  const height = 768
  const options = GetFfmpegOptions.getFfmpegOptions(fps, width, height, outFile)
  const childProcess = spawn(ffmpegPath, options, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  FfmpegProcessState.set(childProcess)
  childProcess.stdout.on('data', (x) => {
    console.log({ x: x.toString() })
  })
  childProcess.stderr.on('data', (x) => {
    console.log({ x: x.toString() })
  })
  childProcess.stdin.on('finish', handleStdinFinished)
  childProcess.stdin.on('error', handleStdinError)
  childProcess.on('exit', handleExit)
}
