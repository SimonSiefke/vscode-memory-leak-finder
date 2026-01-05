export const getCompressOptions = (inputFile: string, outputFile: string): readonly string[] => {
  return [
    '-i',
    inputFile,
    '-c:v',
    'libvpx-vp9',
    '-crf',
    '0',
    '-b:v',
    '0',
    '-lossless',
    '1',
    '-map_metadata',
    '0',
    '-threads',
    '0',
    '-y',
    outputFile,
  ]
}

