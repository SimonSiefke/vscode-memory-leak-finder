import { createTodoMvcTest } from '../shared/todomvc.ts'

export const requiresNetwork = true

export const skip = true

const test = createTodoMvcTest({
  heading: 'Todos',
  url: 'https://todomvc.com/examples/angular/dist/browser/',
  urlPattern: /^https:\/\/todomvc\.com\/examples\/angular\/dist\/browser\/?(?:#\/all)?$/,
})

export const setup = test.setup
export const run = test.run
export const teardown = test.teardown
