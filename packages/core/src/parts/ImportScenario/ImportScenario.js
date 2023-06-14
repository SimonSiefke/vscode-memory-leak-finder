import VError from "verror";

export const importScenario = async (scenarioPath) => {
  try {
    return await import(scenarioPath);
  } catch (error) {
    throw new VError(error, `Failed to import scenario ${scenarioPath}`);
  }
};
