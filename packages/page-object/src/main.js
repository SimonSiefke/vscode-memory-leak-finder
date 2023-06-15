import * as Parts from "./parts/Parts/Parts.js";

export const create = ({ page, expect, VError, child }) => {
  const api = Object.create(null);
  for (const [key, value] of Object.entries(Parts)) {
    api[key] = value.create({ page, expect, VError });
  }
  api["Electron"] = {
    async evaluate(expression) {
      return await child.evaluate(expression);
    },
  };
  return api;
};
