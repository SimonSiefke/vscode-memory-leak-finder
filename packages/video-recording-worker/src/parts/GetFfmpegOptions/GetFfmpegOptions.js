import * as Assert from '../Assert/Assert.js'

export const getFfmpegOptions = (fps, width, height, outFile) => {
  Assert.number(fps)
  Assert.number(width)
  Assert.number(height)
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
    '-',
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
    '-vf',
    `pad=${width}:${height}:0:0:gray,crop=${width}:${height}:0:0`,
    outFile,
  ]
  return args
}
