import * as Assert from '../Assert/Assert.js'

export const state = {
  /**
   * @type {any[]}
   */
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
