import * as Main from './parts/Main/Main.ts'

Main.main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
