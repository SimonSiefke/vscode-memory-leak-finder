import { createTodoMvcTest } from '../shared/todomvc.ts'

export const requiresNetwork = true

export const skip = true

const test = createTodoMvcTest({
  heading: 'todos',
  url: 'https://todomvc.com/examples/vue/dist/',
  urlPattern: /^https:\/\/todomvc\.com\/examples\/vue\/dist\/?(?:#\/?)?$/,
})

export const setup = test.setup
export const run = test.run
export const teardown = test.teardown
