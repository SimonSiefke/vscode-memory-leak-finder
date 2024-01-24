import * as Arrays from '../Arrays/Arrays.js'

const getKey = (element) => {
  return `${element.scriptId}:${element.lineNumber}:${element.columnNumber}`
}

const compareCount = (a, b) => {
  return b.count - a.count
}

const sortValues = (values) => {
  return Arrays.toSorted(values, compareCount)
}

const sort = (array) => {
  const map = Object.create(null)
  for (const element of array) {
    const key = getKey(element)
    map[key] ||= {
      count: 0,
      name: element.name,
      url: `${element.url}:${element.lineNumber}:${element.columnNumber}`,
    }
    map[key].count++
  }
  const values = Object.values(map)
  return sortValues(values)
}

export const compareNamedFunctionCount = (before, after) => {
  return {
    after: sort(after),
    before: sort(before),
  }
}
