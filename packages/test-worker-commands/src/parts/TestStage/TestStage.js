export const beforeSetup = async (module, context) => {
  if (module.beforeSetup) {
    await module.beforeSetup(context)
  }
}

export const setup = async (module, context) => {
  if (module.setup) {
    await module.setup(context)
  }
}

export const teardown = async (module, context) => {
  if (module.teardown) {
    await module.teardown(context)
  }
}

export const run = async (module, context) => {
  if (!module.run) {
    throw new Error(`test case is missing a run function`)
  }
  await module.run(context)
}
