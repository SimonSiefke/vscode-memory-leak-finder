export const beforeSetup = async ({ userDataDir, writeJson, join }) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

export const run = async ({ TitleBar }) => {
  await TitleBar.showMenu();
  await TitleBar.hideMenu();
};
