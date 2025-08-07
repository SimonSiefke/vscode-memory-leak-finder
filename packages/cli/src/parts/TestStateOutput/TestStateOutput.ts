import * as TestOutputState from '../TestOutputState/TestOutputState.ts'
import * as TestOutputType from '../TestOutputType/TestOutputType.ts'
import * as Character from '../Character/Character.ts'

export const addStdout = (data) => {
  TestOutputState.add({ type: TestOutputType.Stdout, data })
}

export const addStdErr = (data) => {
  TestOutputState.add({ type: TestOutputType.Stderr, data })
}
const getData = (item) => {
  return item.data
}

const getBuffer = (pending) => {
  const dataArray = pending.map(getData)
  return Buffer.concat(dataArray)
}

export const clearPending = () => {
  const pending = TestOutputState.getAll()
  if (pending.length === 0) {
    return Character.EmptyString
  }
  TestOutputState.clear()
  const buffer = getBuffer(pending)
  return buffer.toString()
}
