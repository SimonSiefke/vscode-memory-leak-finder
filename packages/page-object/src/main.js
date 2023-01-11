import * as Editor from "./parts/Editor/Editor.js";
import * as Explorer from "./parts/Explorer/Explorer.js";
import * as Suggest from "./parts/Suggest/Suggest.js";

export const create = ({ page, expect, VError }) => {
  return {
    Editor: Editor.create({ page, expect, VError }),
    Explorer: Explorer.create({ page, expect, VError }),
    Suggest: Suggest.create({ page, expect, VError }),
  };
};
