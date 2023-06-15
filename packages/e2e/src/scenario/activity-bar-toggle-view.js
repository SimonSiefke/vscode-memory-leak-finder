export const run = async ({ ActivityBar, Explorer }) => {
  await Explorer.focus();
  await ActivityBar.showSearch();
  await ActivityBar.showSourceControl();
  await ActivityBar.showRunAndDebug();
  await ActivityBar.showExtensions();
  await ActivityBar.showExplorer();
};
