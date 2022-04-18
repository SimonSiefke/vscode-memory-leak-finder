import * as Electron from "../Electron/Electron.js";

export const runScenario = async () => {
  const webSocketUrl = await Electron.launch();
  console.log({ webSocketUrl });
};
