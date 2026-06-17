/**
 * @param {{ Workbench: any; QuickPick: any }} param0
 */
export const run = async ({ Workbench, QuickPick }) => {
  await QuickPick.executeCommand('New Chat')
}
