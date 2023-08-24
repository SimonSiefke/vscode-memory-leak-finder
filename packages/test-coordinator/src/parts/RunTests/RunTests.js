import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.js'

const callback = (method, ...params) => {
  console.log({ callback: method, params })
}

export const runTests = async (root, cwd, filterValue, headlessMode, color) => {
  return RunTestsWithCallback.runTests(root, cwd, filterValue, headlessMode, color, callback)
}
