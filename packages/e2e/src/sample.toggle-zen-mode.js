export const run = async ({ QuickPick }) => {
  await QuickPick.show();
  await QuickPick.select("View: Toggle Zen Mode");
  await QuickPick.show();
  await QuickPick.select("View: Toggle Zen Mode");
};
