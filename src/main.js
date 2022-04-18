import { runScenario } from "./parts/Main/Main.js";

const main = async () => {
  const scenario = process.env.SCENARIO || "Base";
  await runScenario(scenario);
};

main();
