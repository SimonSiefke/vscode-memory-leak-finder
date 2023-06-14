export const getVscodeArgs = ({ userDataDir }) => {
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
    ".",
  ];
};
