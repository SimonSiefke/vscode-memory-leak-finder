import type { ChildProcess } from 'child_process'

interface State {
  outFile: string
  process: ChildProcess | undefined
}

export const state: State = {
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
