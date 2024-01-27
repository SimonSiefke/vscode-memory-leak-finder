import * as Assert from '../Assert/Assert.js'
import * as ImproveDisposableOutput from '../ImproveDisposableOutput/ImproveDisposableOutput.js'

const addDeltas = (prettyBefore, prettyAfter) => {
  const newItems = []
  const countMap = Object.create(null)
  for (const item of prettyBefore) {
    countMap[item.name] = item.count
  }
  for (const item of prettyAfter) {
    const { name, count, location } = item
    newItems.push({
      name,
      count,
      oldCount: countMap[item.name] || 0,
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
