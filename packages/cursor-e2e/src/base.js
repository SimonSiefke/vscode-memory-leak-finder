/**
 * @param {{ Workbench: any }} param0
 */
export const run = async ({ Workbench }) => {
  await Workbench.shouldBeVisible()
}
