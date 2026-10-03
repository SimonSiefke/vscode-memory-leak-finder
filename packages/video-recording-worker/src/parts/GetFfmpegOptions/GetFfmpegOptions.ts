import * as Assert from '../Assert/Assert.ts'

export const getFfmpegOptions = (fps: number, outFile: string): readonly string[] => {
  Assert.number(fps)
  Assert.string(outFile)
  const args = [
    '-loglevel',
    'error',
    '-f',
    'image2pipe',
    '-avioflags',
    'direct',
    '-fpsprobesize',
    '0',
    '-probesize',
    '32',
    '-analyzeduration',
    '0',
    '-c:v',
    'mjpeg',
    '-i',
    'pipe:0',
    '-y',
    '-an',
    '-r',
    `${fps}`,
    '-c:v',
    'vp8',
    '-qmin',
    '0',
    '-qmax',
    '50',
    '-crf',
    '8',
    '-deadline',
    'realtime',
    '-speed',
    '8',
    '-b:v',
    '1M',
    '-threads',
    '1',
    outFile,
  ]
  return args
}
