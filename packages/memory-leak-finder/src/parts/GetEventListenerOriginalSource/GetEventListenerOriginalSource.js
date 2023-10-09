import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'

export const getEventListenerOriginalSource = async (eventListener) => {
  const { stack, sourceMaps } = eventListener
  if (stack && sourceMaps) {
    const firstSourceMapUrl = sourceMaps[0]
    const sourceMap = await LoadSourceMap.loadSourceMap(firstSourceMapUrl)
    console.log({ sourceMap })
  }
}
