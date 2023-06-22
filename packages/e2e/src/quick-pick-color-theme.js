export const setup = async ({ QuickPick }) => {
  await QuickPick.showColorTheme();
};

const Colors = {
  DarkModern: " #1f1f1f",
  DarkPlus: " #1e1e1e",
  KimbieDark: " #221a0f",
};

export const run = async ({ QuickPick, Workbench }) => {
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern);
  await QuickPick.focusNext();
  await Workbench.shouldHaveEditorBackground(Colors.DarkPlus);
  await QuickPick.focusNext();
  await Workbench.shouldHaveEditorBackground(Colors.KimbieDark);
  await QuickPick.focusPrevious();
  await QuickPick.focusPrevious();
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern);
};
