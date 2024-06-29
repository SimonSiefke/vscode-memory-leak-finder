import { ChildProcess } from 'child_process'

export const state = {
  /**
   * @type {ChildProcess|undefined}
   */
  process: undefined,
  outFile: '',
}

export const set = (value) => {
  state.process = value
}

export const get = () => {
  return state.process
}

export const getOutFile = () => {
  return state.outFile
}

export const setOutFile = (outFile) => {
  state.outFile = outFile
}
