import * as Assert from '../Assert/Assert.js'

const chapters = []

export const addChapter = (name, time) => {
  Assert.string(name)
  Assert.number(time)
  chapters.push({
    name,
    time,
  })
  console.log('chapter', name, time)
}
