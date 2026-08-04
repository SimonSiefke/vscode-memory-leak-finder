import { createTodoMvcTest } from '../shared/todomvc.ts'

export const requiresNetwork = true

export const skip = true

const test = createTodoMvcTest({
  heading: 'todos',
  shadowHostSelector: 'todo-app',
  url: 'https://todomvc.com/examples/lit/dist/',
  urlPattern: /^https:\/\/todomvc\.com\/examples\/lit\/dist\/?$/,
})

export const setup = test.setup
export const run = test.run
export const teardown = test.teardown
