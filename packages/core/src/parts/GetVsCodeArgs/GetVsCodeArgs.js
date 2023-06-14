export const getVscodeArgs = ({ userDataDir, extraLaunchArgs }) => {
  return [
    "--wait",
    "--new-window",
    "--no-sandbox",
    "--disable-updates",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    "--disable-extensions",
    "--user-data-dir",
    userDataDir,
    ...extraLaunchArgs,
    ".",
  ];
};
