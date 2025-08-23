import type { ChildProcess } from 'child_process'

interface State {
  process: ChildProcess | undefined
  outFile: string
}

export const state: State = {
  process: undefined,
  outFile: '',
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
