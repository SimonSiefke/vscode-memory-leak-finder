import * as Assert from '../Assert/Assert.ts'

interface State {
  chapters: any[]
}

export const state: State = {
  chapters: [],
}

export const addChapter = (name, time) => {
  Assert.string(name)
  Assert.number(time)
  state.chapters.push({
    name,
    time,
  })
}
