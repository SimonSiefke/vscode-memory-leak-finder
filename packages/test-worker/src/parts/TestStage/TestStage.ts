export const beforeSetup = async (module: any, context: any) => {
  if (module.beforeSetup) {
    await module.beforeSetup(context)
  }
}

export const setup = async (module: any, context: any) => {
  if (module.setup) {
    await module.setup(context)
  }
}

export const teardown = async (module: any, context: any) => {
  if (module.teardown) {
    await module.teardown(context)
  }
}

export const run = async (module: any, context: any) => {
  if (!module.run) {
    throw new Error(`test case is missing a run function`)
  }
  await module.run(context)
}
