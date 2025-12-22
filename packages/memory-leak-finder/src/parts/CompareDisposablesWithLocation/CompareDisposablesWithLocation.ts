import * as Assert from '../Assert/Assert.ts'
import * as ImproveDisposableOutput from '../ImproveDisposableOutput/ImproveDisposableOutput.ts'

const addDeltas = (prettyBefore, prettyAfter) => {
  const newItems: any[] = []
  const countMap = Object.create(null)
  for (const item of prettyBefore) {
    countMap[item.name] = item.count
  }
  for (const item of prettyAfter) {
    const { count, location, name } = item
    const oldCount = countMap[item.name] || 0
    const delta = count - oldCount
    newItems.push({
      count,
      delta,
      location,
      name,
    })
  }
  return newItems
}

export const compareDisposablesWithLocation = async (before, after) => {
  const beforeResult = before
  const afterResult = after.result
  const { scriptMap } = after
  Assert.array(beforeResult)
  Assert.array(afterResult)
  Assert.object(scriptMap)
  const prettyBefore = await ImproveDisposableOutput.improveDisposableOutput(beforeResult, scriptMap)
  const prettyAfter = await ImproveDisposableOutput.improveDisposableOutput(afterResult, scriptMap)
  const withDeltas = addDeltas(prettyBefore, prettyAfter)
  return withDeltas
}
