import * as ActivityBar from "./parts/ActivityBar/ActivityBar.js";
import * as Editor from "./parts/Editor/Editor.js";
import * as Explorer from "./parts/Explorer/Explorer.js";
import * as Panel from "./parts/Panel/Panel.js";
import * as QuickPick from "./parts/QuickPick/QuickPick.js";
import * as Suggest from "./parts/Suggest/Suggest.js";

export const create = ({ page, expect, VError }) => {
  return {
    ActivityBar: ActivityBar.create({ page, expect, VError }),
    Editor: Editor.create({ page, expect, VError }),
    Explorer: Explorer.create({ page, expect, VError }),
    Panel: Panel.create({ page, expect, VError }),
    QuickPick: QuickPick.create({ page, expect, VError }),
    Suggest: Suggest.create({ page, expect, VError }),
  };
};
