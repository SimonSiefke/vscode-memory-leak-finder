import * as Env from '../Env/Env.ts'

export const isCi = Boolean(Env.env.CI)
