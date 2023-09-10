import * as Ffmpeg from '../Ffmpeg/Ffmpeg.js'

export const start = async () => {
  console.log('start video')
  await Ffmpeg.start()
}
