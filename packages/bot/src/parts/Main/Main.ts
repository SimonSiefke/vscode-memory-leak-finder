import { run } from 'probot'
import { app } from '../App/App.ts'

export const main = async (): Promise<void> => {
  await run(app)
}
