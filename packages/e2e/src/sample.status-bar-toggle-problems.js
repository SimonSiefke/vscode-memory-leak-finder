export const beforeSetup = async ({ userDataDir, join, writeJson }) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

export const run = async ({ StatusBar }) => {
  const problems = await StatusBar.item("status.problems");
  await problems.hide();
  await problems.show();
};
