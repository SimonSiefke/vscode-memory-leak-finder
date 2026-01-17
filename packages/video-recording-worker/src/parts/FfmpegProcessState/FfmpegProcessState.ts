import type { ChildProcess } from 'node:child_process'

interface State {
  compressVideo: boolean
  outFile: string
  process: ChildProcess | undefined
}

export const state: State = {
  compressVideo: false,
  outFile: '',
  process: undefined,
}

export const set = (value: ChildProcess | undefined): void => {
  state.process = value
}

export const get = (): any => {
  return state.process
}

export const getOutFile = () => {
  return state.outFile
}

export const setOutFile = (outFile: string) => {
  state.outFile = outFile
}

export const setCompressVideo = (compressVideo: boolean) => {
  state.compressVideo = compressVideo
}

export const getCompressVideo = (): boolean => {
  return state.compressVideo
}
