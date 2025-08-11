import * as Assert from '../Assert/Assert.ts'
import * as ImproveDisposableOutput from '../ImproveDisposableOutput/ImproveDisposableOutput.ts'

const addDeltas = (prettyBefore, prettyAfter) => {
  const newItems = []
  const countMap = Object.create(null)
  for (const item of prettyBefore) {
    countMap[item.name] = item.count
  }
  for (const item of prettyAfter) {
    const { name, count, location } = item
    const oldCount = countMap[item.name] || 0
    const delta = count - oldCount
    newItems.push({
      name,
      count,
      delta,
      location,
    })
  }
  return newItems
}

export const compareDisposablesWithLocation = async (before, after) => {
  const beforeResult = before
  const afterResult = after.result
  const scriptMap = after.scriptMap
  Assert.array(beforeResult)
  Assert.array(afterResult)
  Assert.object(scriptMap)
  const prettyBefore = await ImproveDisposableOutput.improveDisposableOutput(beforeResult, scriptMap)
  const prettyAfter = await ImproveDisposableOutput.improveDisposableOutput(afterResult, scriptMap)
  const withDeltas = addDeltas(prettyBefore, prettyAfter)
  return withDeltas
}
