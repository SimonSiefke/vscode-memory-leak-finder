import { ChildProcess } from 'child_process'

export const state = {
  /**
   * @type {ChildProcess|undefined}
   */
  process: undefined,
}

export const set = (value) => {
  state.process = value
}

export const get = () => {
  return state.process
}
