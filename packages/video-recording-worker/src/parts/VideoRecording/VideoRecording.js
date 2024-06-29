import * as Ffmpeg from '../Ffmpeg/Ffmpeg.js'
import * as Assert from '../Assert/Assert.js'

export const start = async (outFile) => {
  Assert.string(outFile)
  await Ffmpeg.start(outFile)
}

export const addChapter = (name) => {
  Assert.string(name)
}
