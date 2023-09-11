import { spawn } from 'child_process'
import * as GetFfmpegOptions from '../GetFfmpegOptions/GetFfmpegOptions.js'
import * as GetFfmpegPath from '../GetFfmpegPath/GetFfmpegPath.js'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'

const handleStdinError = () => {
  console.log('ffmpeg error')
}

const handleStdinFinished = () => {
  console.log('ffmpeg finished')
}

const handleExit = () => {
  console.log('ffmpeg exit')
}

export const start = async () => {
  const ffmpegPath = GetFfmpegPath.getFfmpegPath()
  const fps = 25
  const width = 1024
  const height = 768
  const outFile = '/tmp/video.webm'
  const options = GetFfmpegOptions.getFfmpegOptions(fps, width, height, outFile)
  const childProcess = spawn(ffmpegPath, options, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  console.log({ options })
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
  setTimeout(() => {
    console.log('finish video')
    childProcess.stdin.end()
  }, 15_000)
}
